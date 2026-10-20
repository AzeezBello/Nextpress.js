import { createRequire } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import nextPlugin from "@next/eslint-plugin-next";

const require = createRequire(import.meta.url);
const reactHooksPlugin = require("./node_modules/eslint-config-next/node_modules/eslint-plugin-react-hooks/index.js");

function fixupPlugin(plugin) {
  if (!plugin || !plugin.rules) return plugin;
  const fixedRules = {};
  for (const [ruleName, rule] of Object.entries(plugin.rules)) {
    fixedRules[ruleName] = {
      ...rule,
      create(context) {
        let currentNode = context.sourceCode.ast;
        const proxyContext = new Proxy(context, {
          get(target, prop, receiver) {
            if (prop === "getScope") {
              return (node) => target.sourceCode.getScope(node ?? currentNode ?? target.sourceCode.ast);
            }
            if (prop === "getAncestors") {
              return (node) => target.sourceCode.getAncestors(node ?? currentNode ?? target.sourceCode.ast);
            }
            if (prop === "getDeclaredVariables") {
              return (node) => target.sourceCode.getDeclaredVariables(node ?? currentNode ?? target.sourceCode.ast);
            }
            if (prop === "markVariableAsUsed") {
              return (name, node) => target.sourceCode.markVariableAsUsed(name, node ?? currentNode ?? target.sourceCode.ast);
            }
            return Reflect.get(target, prop, receiver);
          }
        });
        const visitors = rule.create(proxyContext);
        const wrappedVisitors = {};
        for (const [selector, fn] of Object.entries(visitors)) {
          if (typeof fn === "function") {
            wrappedVisitors[selector] = function (node, ...args) {
              if (node && typeof node === "object" && "type" in node) {
                currentNode = node;
              }
              return fn.call(this, node, ...args);
            };
          } else {
            wrappedVisitors[selector] = fn;
          }
        }
        return wrappedVisitors;
      }
    };
  }
  return { ...plugin, rules: fixedRules };
}

const eslintConfig = defineConfig([
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "postcss-tailwind.cjs", "postcss.config.js"]),
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": fixupPlugin(tsPlugin),
      "react-hooks": fixupPlugin(reactHooksPlugin),
      "jsx-a11y": fixupPlugin(jsxA11yPlugin),
      "@next/next": fixupPlugin(nextPlugin)
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
    }
  }
]);

export default eslintConfig;
