import test from 'node:test';
import assert from 'node:assert';
import { truncate } from '../modules/utils.js';

test('truncate - basic functionality', () => {
  // Shorter than maxLength
  assert.strictEqual(truncate('hello', 10), 'hello');
  
  // Equal to maxLength
  assert.strictEqual(truncate('hello', 5), 'hello');
  
  // Longer than maxLength
  assert.strictEqual(truncate('hello world', 5), 'hello…');
});

test('truncate - edge cases', () => {
  // Empty string
  assert.strictEqual(truncate('', 5), '');
  
  // maxLength of 0
  assert.strictEqual(truncate('hello', 0), '…');
});

test('truncate - default maxLength', () => {
  const longString = 'This is a very long string that should be truncated';
  assert.strictEqual(truncate(longString), longString.slice(0, 20) + '…');
  assert.strictEqual(truncate('short').length, 5);
});

test('truncate - multi-byte characters (emojis)', () => {
  // 🍎 is one character but length 2
  const apple = '🍎';
  assert.strictEqual(apple.length, 2);
  
  // Current implementation fails this because it slices at index 1, breaking the surrogate pair
  // We expect it to treat 🍎 as one character
  assert.strictEqual(truncate(apple, 1), apple);
  
  const apples = '🍎🍎🍎';
  assert.strictEqual(truncate(apples, 2), '🍎🍎…');
});
