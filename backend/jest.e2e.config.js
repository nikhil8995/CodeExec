module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
  coverageDirectory: 'coverage-e2e',
  coverageReporters: ['text', 'lcov'],
  setupFiles: ['<rootDir>/tests/setup.js']
};
