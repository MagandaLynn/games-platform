import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/generated/**",
      "**/prisma/migrations/**"
    ]
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    },
    rules: {
      // keep it minimal early; tighten later
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    }
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: {
        "no-restricted-imports": [
            "error",
            {
                "paths": [
                {
                    "name": "@btd/db",
                    "message": "Database access is server-only. Use API routes or server services."
                }
                ]
            }
        ]
        }
    }
];
