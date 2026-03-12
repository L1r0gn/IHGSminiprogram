/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Mock setTimeout and clearTimeout for testing
global.setTimeout = jest.fn((fn, delay) => {
  // Execute immediately in tests
  return fn();
});

global.clearTimeout = jest.fn();

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (!args[0] || typeof args[0] !== 'string' || !args[0].includes('React')) {
    originalWarn.apply(console, args);
  }
};
