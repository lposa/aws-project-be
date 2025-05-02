module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/bin'],
  collectCoverageFrom: ['**/*.{ts,js}', '!**/node_modules/**', '!**/dist/**', '!**/__tests__/**'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
