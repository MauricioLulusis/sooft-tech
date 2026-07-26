import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/cli.mjs';

test('parses command and positionals', () => {
  const a = parseArgs(['add', 'owner/repo', 'extra']);
  assert.equal(a.command, 'add');
  assert.deepEqual(a.positional, ['owner/repo', 'extra']);
});

test('parses boolean flags and aliases', () => {
  const a = parseArgs(['list', '-g', '--json', '-y']);
  assert.equal(a.command, 'list');
  assert.equal(a.flags.global, true);
  assert.equal(a.flags.json, true);
  assert.equal(a.flags.yes, true);
});

test('--agent is repeatable and supports = form', () => {
  const a = parseArgs(['add', 'x', '--agent', 'claude', '--agent=cursor']);
  assert.deepEqual(a.flags.agent, ['claude', 'cursor']);
});

test('version and help flags', () => {
  assert.equal(parseArgs(['-v']).flags.version, true);
  assert.equal(parseArgs(['--help']).flags.help, true);
});

test('unknown option is captured', () => {
  assert.equal(parseArgs(['add', '--nope']).flags.unknown, '--nope');
});
