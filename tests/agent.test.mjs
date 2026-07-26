import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run } from '../src/cli.mjs';
import { resolveStandards } from '../src/standards.mjs';
import { exists } from '../src/util.mjs';

async function quiet(fn) {
  const { log, warn, error } = console;
  console.log = console.warn = console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.warn = warn;
    console.error = error;
  }
}

/** Run fn with console.log captured into an array of lines instead of discarded. */
async function capture(fn) {
  const lines = [];
  const { log, warn, error } = console;
  console.log = console.warn = console.error = (...args) => lines.push(args.join(' '));
  try {
    const code = await fn();
    return { code, output: lines.join('\n') };
  } finally {
    console.log = log;
    console.warn = warn;
    console.error = error;
  }
}

/** Build a minimal but valid sooft-ai-standards source tree. */
function makeStandards(root) {
  const w = (rel, content) => {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  };
  w('skills/sooft/SKILL.md', '---\nname: sooft\n---\nconstitución');
  w('skills/sooft/assets/prompts/sooft.prompt.md', '# /sooft');
  w('skills/sooft-bugs/SKILL.md', '---\nname: sooft-bugs\n---\nrouter');
  w('.github/agents/sooft-code-reviewer.agent.md', '---\nname: sooft-code-reviewer\n---\nrev');
  w('.github/copilot-instructions.md', '# Copilot');
  w('.github/hooks/sooft.json', '{"version":1}');
  w('.github/hooks/banner.txt', 'SOOFT');
  w('AGENTS.md', '# Sooft Engineering AI Rails');
  return root;
}

test('resolveStandards reads the content model', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sooft-std-'));
  makeStandards(tmp);
  const std = resolveStandards(tmp);
  assert.equal(std.skills.length, 2);
  assert.equal(std.agents.length, 1);
  assert.equal(std.agents[0].name, 'sooft-code-reviewer');
  assert.equal(std.prompts.length, 1);
  assert.ok(std.hooks && std.hooks.files.length === 2);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('agent install → remove across tools is exact', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sooft-agent-'));
  const std = makeStandards(path.join(tmp, 'standards'));
  const repo = path.join(tmp, 'repo');
  fs.mkdirSync(path.join(repo, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(repo, '.cursor'), { recursive: true });

  const cwd = process.cwd();
  try {
    process.chdir(repo);
    assert.equal(
      await quiet(() => run(['agent', 'install', std, '--agent', 'claude', '--agent', 'cursor', '--yes'])),
      0,
    );
    assert.ok(exists(path.join(repo, '.claude', 'skills', 'sooft', 'SKILL.md')), 'skill placed');
    assert.ok(exists(path.join(repo, '.claude', 'agents', 'sooft-code-reviewer.md')), 'subagent placed');
    assert.ok(exists(path.join(repo, '.cursor', 'rules', 'sooft-ai-rails.mdc')), 'cursor rule placed');

    assert.equal(await quiet(() => run(['agent', 'remove'])), 0);
    assert.ok(!exists(path.join(repo, '.claude', 'skills', 'sooft')), 'skill removed');
    assert.ok(!exists(path.join(repo, '.cursor', 'rules', 'sooft-ai-rails.mdc')), 'cursor rule removed');
  } finally {
    process.chdir(cwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('generic list/check/remove understand an agent-install (tools-shaped) record', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sooft-agent-generic-'));
  const std = makeStandards(path.join(tmp, 'standards'));
  const repo = path.join(tmp, 'repo');
  fs.mkdirSync(path.join(repo, '.claude'), { recursive: true });

  const cwd = process.cwd();
  try {
    process.chdir(repo);
    assert.equal(
      await quiet(() => run(['agent', 'install', std, '--agent', 'claude', '--yes'])),
      0,
    );

    const listed = await capture(() => run(['list']));
    assert.equal(listed.code, 0);
    assert.ok(!listed.output.includes('vundefined'), 'no literal "vundefined" version label');
    assert.match(listed.output, /claude.*item\(s\) placed/s, 'reports a per-tool placement count');

    const checked = await capture(() => run(['check']));
    assert.equal(checked.code, 0, 'clean check exits 0');
    assert.match(checked.output, /ok /, 'actually verifies placed paths, not a silent no-op');

    const subagentFile = path.join(repo, '.claude', 'agents', 'sooft-code-reviewer.md');
    fs.appendFileSync(subagentFile, '\n// drifted\n');
    const driftChecked = await capture(() => run(['check']));
    assert.equal(driftChecked.code, 1, 'drifted file makes check fail');
    assert.match(driftChecked.output, /modified/, 'reports the drifted path as modified');

    assert.equal(await quiet(() => run(['remove', 'sooft-ai-standards', '--yes'])), 0);
    assert.ok(!exists(subagentFile), 'generic remove deletes tools-shaped placements too');
    assert.ok(!exists(path.join(repo, '.claude', 'skills', 'sooft')), 'generic remove deletes skill dirs too');
    const listedAfter = await capture(() => run(['list']));
    assert.match(listedAfter.output, /No Sooft packs installed here/, 'manifest entry was cleared, not orphaned');
  } finally {
    process.chdir(cwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
