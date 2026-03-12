/**
 * Jest Configuration
 */
module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'pages/**/*.js',
    '!pages/**/*.test.js',
    '!pages/**/node_modules/**'
  ],
  testMatch: [
    '**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
