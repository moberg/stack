module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-console': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
  },
  'env': {
    'commonjs': true,
    'node': true,
    'mocha': true
  },
};
