import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reference material from the design handoff. Linting the prototype
    // sources (different React version, ad-hoc patterns) generates noise that
    // isn't actionable for the production app.
    "handoff/**",
    // Generated Prisma client.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
