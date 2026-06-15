import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';

// Mock the DOM and Chrome APIs before importing the module
global.document = {
  createElement: () => ({}),
  activeElement: { classList: { contains: () => false } },
  getElementById: () => ({ appendChild: () => {} })
};

global.chrome = {
  tabs: {
    query: async () => []
  }
};

// Mock dependencies using node test runner's module mocking capabilities
import * as toastModule from '../modules/toast.js';

// Since we can't overwrite toastModule.toast, we can mock the functions inside it
mock.method(toastModule.toast, 'error');
mock.method(toastModule.toast, 'success');
mock.method(toastModule.toast, 'info');

// Now import the module to test
import { loadOpenTabs } from '../panels/tabs.js';

test('loadOpenTabs - happy path', async () => {
  // Setup mock response
  const mockTabs = [
    { id: 2, index: 1, title: 'Tab 2' },
    { id: 1, index: 0, title: 'Tab 1' }
  ];

  global.chrome.tabs.query = async () => mockTabs;

  const result = await loadOpenTabs();

  // Should sort by index
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].id, 1);
  assert.strictEqual(result[1].id, 2);
});

test('loadOpenTabs - error path catches error and returns empty array', async () => {
  // Clear mock calls
  toastModule.toast.error.mock.restore();

  // We need to provide an implementation to avoid calling the original which uses the DOM heavily.
  mock.method(toastModule.toast, 'error', () => {});

  // Setup mock to throw
  global.chrome.tabs.query = async () => {
    throw new Error('Network error');
  };

  const result = await loadOpenTabs();

  // Should return empty array
  assert.deepStrictEqual(result, []);

  // Should call toast.error
  assert.strictEqual(toastModule.toast.error.mock.calls.length, 1);
  assert.strictEqual(
    toastModule.toast.error.mock.calls[0].arguments[0],
    'Could not load tabs'
  );
});
