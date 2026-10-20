const fs = require("fs");
const path = require("path");
const { compile } = require("tailwindcss");

function collectFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        collectFiles(full, out);
      }
    } else if (/\.(tsx?|jsx?|mdx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function extractCandidates(rootDir) {
  const files = collectFiles(path.join(rootDir, "src"));
  const candidates = new Set();
  const tokenRegex = /[a-zA-Z0-9_/:.\-[\]%#()!&+>~*=]+/g;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(tokenRegex);
    if (matches) {
      for (const m of matches) {
        candidates.add(m);
      }
    }
  }
  return Array.from(candidates);
}

const twDir = path.dirname(require.resolve("tailwindcss/package.json"));

module.exports = function tailwindV4PostcssPlugin() {
  return {
    postcssPlugin: "tailwindcss-v4-adapter",
    async Once(root, { result, postcss }) {
      const from = result.opts.from || path.join(process.cwd(), "src/app/globals.css");
      const rawCss = root.toString();
      if (!rawCss.includes('@import "tailwindcss"') && !rawCss.includes("@tailwind")) {
        return;
      }

      const compiler = await compile(rawCss, {
        base: path.dirname(from),
        from,
        loadStylesheet: async (id, base) => {
          if (id === "tailwindcss") {
            const p = path.join(twDir, "index.css");
            return { path: p, base: twDir, content: fs.readFileSync(p, "utf8") };
          }
          if (id.startsWith("tailwindcss/")) {
            const sub = id.slice("tailwindcss/".length);
            const p = path.join(twDir, sub.endsWith(".css") ? sub : `${sub}.css`);
            return { path: p, base: twDir, content: fs.readFileSync(p, "utf8") };
          }
          const resolved = path.resolve(base, id);
          return {
            path: resolved,
            base: path.dirname(resolved),
            content: fs.readFileSync(resolved, "utf8"),
          };
        },
      });

      const candidates = extractCandidates(process.cwd());
      const builtCss = compiler.build(candidates);
      const parsed = postcss.parse(builtCss, { from });
      root.removeAll();
      root.append(parsed.nodes);
    },
  };
};
module.exports.postcss = true;
