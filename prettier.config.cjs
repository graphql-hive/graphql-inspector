// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('@theguild/prettier-config');

// eslint-disable-next-line
config.plugins = config.plugins.map(p => require(p));

module.exports = {
  ...config,
  proseWrap: 'always',
};
