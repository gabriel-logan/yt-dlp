import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintPluginPrettierRecommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            ["^\\u0000"],
            ["^react", "^@?\\w"],
            ["^@/"],
            ["^src/"],
            ["^\\."],
          ],
        },
      ],
    },
  },
]);
