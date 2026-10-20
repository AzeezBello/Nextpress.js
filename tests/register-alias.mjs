import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const rel = specifier.slice(2);
      const target = path.join(rootDir, "src", `${rel}.ts`);
      return nextResolve(pathToFileURL(target).href, context);
    }
    return nextResolve(specifier, context);
  }
});
