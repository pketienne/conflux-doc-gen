module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ["eslint:recommended", "prettier"],
  parserOptions: {
    parser: "@babel/eslint-parser",
    requireConfigFile: false,
  },
  plugins: ["prettier"],
  ignorePatterns: ["**/public/**", "**/dist/**"],
  rules: {},
};
