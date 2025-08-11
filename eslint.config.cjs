const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      semi: ['error', 'always']
    }
  }
];
