require('@testing-library/jest-dom');

const { toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);

if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ token: 'test-csrf-token' }),
    })
  );
}

/**
 * Global per-test cleanup. Without this, state set by one test (localStorage
 * entries, sessionStorage entries, jest.fn() call history) leaks into the
 * next test in the same jsdom worker, causing flakes that only reproduce when
 * the suite runs together. Each test file already manages its own setup; this
 * adds a uniform reset step at the end of every test.
 */
afterEach(() => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
  jest.clearAllMocks();
});
