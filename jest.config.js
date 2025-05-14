/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'node',
  resolver: 'jest-ts-webcompat-resolver',
  transform: {
    '^.+\.tsx?$': ['ts-jest', {}],
  },
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)\\.js$': '<rootDir>/src/$1.ts',
    // '^(\\./.*)\\.js$': '$1.ts',  // 相対パスへの対応
  },
};
