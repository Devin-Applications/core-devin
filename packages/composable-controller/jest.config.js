/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const merge = require('deepmerge');
const path = require('path');

const baseConfig = require('../../jest.config.packages');

const displayName = path.basename(__dirname);

module.exports = merge(baseConfig, {
  // The display name when running multiple projects
  displayName,

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  // Here we ensure that Jest resolves `@metamask/*` imports to the uncompiled source code for packages that live in this repo.
  // NOTE: This must be synchronized with the `paths` option in `tsconfig.packages.json`.
  moduleNameMapper: {
    '^@metamask/(.+)$': [
      '<rootDir>/../$1/src',
      // Some @metamask/* packages we are referencing aren't in this monorepo,
      // so in that case use their published versions
      '<rootDir>/../../node_modules/@metamask/$1',
    ],
    '^@metamask/utils/node$':
      '<rootDir>/../../node_modules/@metamask/utils/dist/node.cjs',
  },
});
