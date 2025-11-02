module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  // Exclude the raw ad-hoc runner at test/test.ts which is not a Jest suite
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: false,
  transform: {
    '^.+\\.ts$': ['ts-jest'],
    '^.+\\.js$': ['babel-jest'],
  },
  // Do not ignore node_modules so ESM packages used by 'unified' are transformed
  transformIgnorePatterns: [],
};
