import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerpRgb, rgb, setColorEnabled } from '../src/colors.mjs';

test('lerpRgb returns endpoints and midpoint', () => {
  const from = [0, 0, 0];
  const to = [100, 200, 50];
  assert.deepEqual(lerpRgb(from, to, 0), [0, 0, 0]);
  assert.deepEqual(lerpRgb(from, to, 1), [100, 200, 50]);
  assert.deepEqual(lerpRgb(from, to, 0.5), [50, 100, 25]);
});

test('rgb returns plain text when color disabled', () => {
  setColorEnabled(false);
  assert.equal(rgb(1, 2, 3, 'hello'), 'hello');
});

test('rgb wraps with ANSI when color enabled', () => {
  setColorEnabled(true);
  const out = rgb(10, 20, 30, 'x');
  assert.ok(out.includes('\x1b[38;2;10;20;30m'));
  assert.ok(out.endsWith('\x1b[39m'));
  setColorEnabled(false);
});
