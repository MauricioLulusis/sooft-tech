import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run } from '../src/cli.mjs';
import { readManifest } from '../src/manifest.mjs';
import { exists } from '../src/util.mjs';

/** Silence the CLI's console output for the duration of `fn`. */
async function quiet(fn) {
  const log = console.log;
  const warn = console.warn;
  const err = console.error;
  console.log = console.warn = console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.warn = warn;
    console.error = err;
  }
}

test('full loop: init → add → list → remove', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sooft-e2e-'));
  const source = path.join(tmp, 'source');
  const repo = path.join(tmp, 'repo');
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(path.join(repo, '.claude'), { recursive: true });

  const cwd = process.cwd();
  try {
    // init in the source dir
    process.chdir(source);
    assert.equal(await quiet(() => run(['init'])), 0);
    assert.ok(exists(path.join(source, 'sooft.pack.json')));

    // add into the repo
    process.chdir(repo);
    const rel = path.relative(repo, source);
    assert.equal(await quiet(() => run(['add', rel, '--yes'])), 0);

    const rule = path.join(repo, '.claude', 'rules', 'sooft-standards-engineering.md');
    assert.ok(exists(rule), 'rule file placed');
    assert.ok(exists(path.join(repo, '.claude', 'settings.json')), 'settings written');

    const manifest = readManifest(repo);
    assert.ok(manifest.packs['sooft-standards'], 'pack recorded');

    // remove
    assert.equal(await quiet(() => run(['remove', 'sooft-standards'])), 0);
    assert.ok(!exists(rule), 'rule file removed');
    assert.equal(readManifest(repo).packs['sooft-standards'], undefined, 'record gone');
  } finally {
    process.chdir(cwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
