import antfu from "@antfu/eslint-config";

export default antfu({
  type: "lib",
  formatters: true,
  typescript: true,
  stylistic: {
    indent: 2,
    semi: true,
    quotes: "double",
  },
}, {
  files: ["**/*.{ts,tsx}"],
  rules: {
    "no-console": ["warn"],
    "perfectionist/sort-imports": ["error", {
      tsconfig: {
        rootDir: ".",
      },
    }],
  },
});
