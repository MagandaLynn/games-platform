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
        projectService: {
          allowDefaultProject: [
            "*.ts",
            "*.tsx",
            "packages/db/prisma.config.ts",
            "packages/db/prisma/seed.ts",
            "prisma.config.ts",
            "prisma/seed.ts"
          ]
        }
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
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
        "no-restricted-imports": [
            "error",
            {
                "paths": [
                {
                    "name": "@playseed/db",
                    "message": "Database access is server-only. Use API routes or server services."
                }
                ]
            }
        ]
        }
    }
];
