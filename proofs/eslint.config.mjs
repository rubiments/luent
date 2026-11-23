import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import mutability from "eslint-plugin-mutability";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      mutability
    },
    rules: {
      "mutability/check-invocation-boundary": "warn"
    }
  },
]);
