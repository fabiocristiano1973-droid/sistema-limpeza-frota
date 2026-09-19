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
    // apps/governo-interior é um projeto Next.js separado, com seu próprio
    // eslint.config.mjs — não faz parte deste lint (evita que .next/ e
    // node_modules/ gerados por aquele build "vazem" para cá).
    "apps/**",
  ]),
]);

export default eslintConfig;
