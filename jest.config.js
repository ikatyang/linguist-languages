module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/tests/**/*.ts', '**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/vendor/'],
  transform: { '\\.ts$': 'ts-jest' },
  coverageReporters: ['lcov', 'text-summary'],
  collectCoverage: !!process.env.CI,
  collectCoverageFrom: ['scripts/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  snapshotSerializers: ['jest-snapshot-serializer-raw'],
}
