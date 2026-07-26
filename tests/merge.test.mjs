import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeHooks, unmergeHooks } from '../src/merge.mjs';
import { readJson, writeJson } from '../src/util.mjs';

function tmpSettings() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sooft-merge-'));
  return path.join(dir, 'settings.json');
}

const HOOKS = { hooks: { SessionStart: [{ hooks: [{ type: 'prompt', prompt: 'hi' }] }] } };

test('merge then unmerge leaves settings clean', () => {
  const p = tmpSettings();
  const events = mergeHooks(p, 'pack-a', HOOKS);
  assert.deepEqual(events, ['SessionStart']);

  let s = readJson(p);
  assert.equal(s.hooks.SessionStart.length, 1);
  assert.equal(s.hooks.SessionStart[0]._sooftPack, 'pack-a');

  unmergeHooks(p, 'pack-a');
  s = readJson(p);
  assert.equal(s.hooks, undefined);
});

test('merge is idempotent (no duplicate groups)', () => {
  const p = tmpSettings();
  mergeHooks(p, 'pack-a', HOOKS);
  mergeHooks(p, 'pack-a', HOOKS);
  const s = readJson(p);
  assert.equal(s.hooks.SessionStart.length, 1);
});

test('merge preserves hand-written and other-pack hooks', () => {
  const p = tmpSettings();
  writeJson(p, { hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'mine' }] }] } });
  mergeHooks(p, 'pack-a', HOOKS);
  let s = readJson(p);
  assert.equal(s.hooks.SessionStart.length, 2);

  unmergeHooks(p, 'pack-a');
  s = readJson(p);
  assert.equal(s.hooks.SessionStart.length, 1);
  assert.equal(s.hooks.SessionStart[0].hooks[0].command, 'mine');
});
