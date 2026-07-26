import path from 'node:path';
import { copyDir, copyFile, writeText, readText, removeFile, removeDir, pruneEmptyDir, sha256, hashFile } from '../util.mjs';
import { EXIT, STANDARDS_PACK } from '../constants.mjs';
import { resolveSource } from '../source.mjs';
import { resolveStandards, instructionsAsRule } from '../standards.mjs';
import { baseRoot } from '../agents.mjs';
import { resolveToolTargets, toolPaths } from '../tools.mjs';
import { getSource, setSource, clearSource } from '../config.mjs';
import { readManifest, writeManifest, getPackRecord, setPackRecord, removePackRecord } from '../manifest.mjs';
import { info, success, warn, heading, bullet, step, fail, isInteractive, confirm } from '../ui.mjs';
import { cyan, dim, bold, green, red } from '../colors.mjs';

/** Dispatch `sooft agent <install|update|remove|source>`. */
export async function agentCommand(args) {
  const sub = args.positional[0];
  const rest = args.positional.slice(1);
  switch (sub) {
    case 'install':
      return installStandards(args, rest, { update: false });
    case 'update':
      return installStandards(args, rest, { update: true });
    case 'remove':
    case 'rm':
      return removeStandards(args);
    case 'source':
      return sourceCommand(args, rest);
    default:
      warn('usage: sooft agent <install|update|remove|source> [source] [--all] [--agent <tool>] [--dry-run] [-y]');
      return EXIT.usage;
  }
}

async function installStandards(args, rest, { update }) {
  const sourceArg = rest[0] || getSource();
  if (!sourceArg) {
    warn('no standards source configured.');
    info(`  Set one: ${cyan('sooft agent source <owner/repo | git-url | local-path>')}`);
    info(`  Or pass it inline: ${cyan('sooft agent install <source>')}`);
    return EXIT.error;
  }

  const global = args.flags.global;
  const root = baseRoot(global);
  const targets = resolveToolTargets({ explicit: args.flags.agent, all: args.flags.all, root });

  let resolved;
  try {
    step(`Resolving standards ${cyan(sourceArg)}`);
    resolved = resolveSource(sourceArg);
  } catch (err) {
    fail(err.message, EXIT.error);
  }

  try {
    const std = resolveStandards(resolved.dir);
    const plan = targets.map((tool) => buildToolPlan(tool, std, root));
    printPlan(std, plan, { global, update });

    if (args.flags.dryRun) {
      info(dim('  dry run — nothing written.'));
      return EXIT.ok;
    }
    if (!args.flags.yes) {
      if (!isInteractive()) {
        warn('non-interactive: re-run with --yes to approve, or --dry-run to preview.');
        return EXIT.error;
      }
      if (!(await confirm('Install these standards?', true))) {
        info(dim('  aborted.'));
        return EXIT.error;
      }
    }

    // On update, pull out the previous placement first so removed files don't linger.
    const manifest = readManifest(root);
    if (update && getPackRecord(manifest, STANDARDS_PACK)) {
      wipe(getPackRecord(manifest, STANDARDS_PACK), root);
    }

    const record = { source: resolved.ref, installedAt: new Date().toISOString(), tools: {} };
    for (const t of plan) {
      const written = applyToolPlan(t);
      record.tools[t.tool] = { paths: written };
    }
    setPackRecord(manifest, STANDARDS_PACK, record);
    writeManifest(root, manifest);

    info();
    success(`${update ? 'Updated' : 'Installed'} Sooft AI Rails → ${targets.join(', ')}`);
    info(dim(`  ${std.skills.length} skill(s), ${std.agents.length} subagent(s)`));
    return EXIT.ok;
  } catch (err) {
    fail(err.message, EXIT.error);
  } finally {
    resolved.cleanup();
  }
}

/** Compute the operations for one tool. Pure — no writes. */
function buildToolPlan(tool, std, root) {
  const p = toolPaths(tool, root);
  const ops = [];

  if (p.skillsDir) {
    for (const s of std.skills) {
      ops.push({ kind: 'dir', from: s.dir, to: path.join(p.skillsDir, s.name), desc: `skill ${s.name}` });
    }
  }
  if (p.agentsDir) {
    for (const a of std.agents) {
      const name = tool === 'copilot' ? a.base : `${a.name}.md`;
      ops.push({ kind: 'file', from: a.file, to: path.join(p.agentsDir, name), desc: `subagent ${a.name}` });
    }
  }
  if (p.instructions) {
    const from = std.copilotInstructions || std.instructions;
    if (from) ops.push({ kind: 'file', from, to: p.instructions, desc: 'instrucciones' });
  }
  if (p.promptsDir) {
    for (const pr of std.prompts) {
      ops.push({ kind: 'file', from: pr.file, to: path.join(p.promptsDir, pr.base), desc: `prompt ${pr.base}` });
    }
  }
  if (p.hooksDir && std.hooks) {
    for (const f of std.hooks.files) {
      ops.push({ kind: 'file', from: path.join(std.hooks.dir, f), to: path.join(p.hooksDir, f), desc: `hook ${f}` });
    }
  }
  if (p.rulesFile) {
    const content = instructionsAsRule(std, { mdc: p.rulesFile.endsWith('.mdc') });
    ops.push({ kind: 'file', content, to: p.rulesFile, desc: 'reglas (desde AGENTS.md)' });
  }

  return { tool, label: p.label, ops, root };
}

function printPlan(std, plan, { global, update }) {
  info();
  heading(`  ${update ? 'Update' : 'Install'} — Sooft Engineering AI Rails${global ? dim('  (global)') : ''}`);
  info(`  ${dim(`source: ${std.root}`)}`);
  info();
  for (const t of plan) {
    info(`  ${bold(t.label)} ${dim('(' + t.tool + ')')}`);
    if (!t.ops.length) {
      bullet(dim('nada que colocar para esta herramienta'));
      continue;
    }
    const byKind = summarize(t.ops);
    for (const line of byKind) bullet(line);
  }
  info();
}

/** Condense ops into a few human lines per tool. */
function summarize(ops) {
  const skills = ops.filter((o) => o.desc.startsWith('skill')).length;
  const agents = ops.filter((o) => o.desc.startsWith('subagent')).length;
  const prompts = ops.filter((o) => o.desc.startsWith('prompt')).length;
  const hooks = ops.filter((o) => o.desc.startsWith('hook')).length;
  const other = ops.filter(
    (o) => !/^(skill|subagent|prompt|hook)/.test(o.desc),
  );
  const lines = [];
  if (skills) lines.push(`${green('skills')}      ${skills}`);
  if (agents) lines.push(`${green('subagents')}   ${agents}`);
  if (prompts) lines.push(`${green('prompts')}     ${prompts}`);
  if (hooks) lines.push(`${green('hooks')}       ${hooks}`);
  for (const o of other) lines.push(`${green(o.desc.padEnd(11))} → ${dim(path.relative(o.to.split(/[\\/]/).slice(0, 1).join('/'), o.to) || o.to)}`);
  return lines;
}

/** Execute a tool plan; return the list of {path, kind, sha?} written (for the manifest). */
function applyToolPlan(t) {
  const written = [];
  for (const op of t.ops) {
    if (op.kind === 'dir') {
      copyDir(op.from, op.to);
      written.push({ path: op.to, kind: op.kind });
    } else if (op.content !== undefined) {
      writeText(op.to, op.content);
      written.push({ path: op.to, kind: op.kind, sha: sha256(op.content) });
    } else {
      copyFile(op.from, op.to);
      written.push({ path: op.to, kind: op.kind, sha: hashFile(op.to) });
    }
  }
  return written;
}

function removeStandards(args) {
  const root = baseRoot(args.flags.global);
  const manifest = readManifest(root);
  const record = getPackRecord(manifest, STANDARDS_PACK);
  if (!record) {
    warn('Sooft AI Rails is not installed here.');
    return EXIT.error;
  }
  step('Removing Sooft AI Rails');
  const removed = wipe(record, root);
  removePackRecord(manifest, STANDARDS_PACK);
  writeManifest(root, manifest);
  info();
  success(`Removed Sooft AI Rails ${dim(`(${removed} item(s))`)}`);
  return EXIT.ok;
}

/** Delete everything a standards record placed. Returns the count removed. */
export function wipe(record, root) {
  let n = 0;
  for (const rec of Object.values(record.tools || {})) {
    for (const item of rec.paths || []) {
      const ok = item.kind === 'dir' ? removeDir(item.path) : removeFile(item.path);
      if (ok) {
        n++;
        bullet(`${red('-')} ${dim(path.relative(root, item.path))}`);
      }
      pruneEmptyDir(path.dirname(item.path));
    }
  }
  return n;
}

function sourceCommand(args, rest) {
  if (args.flags.reset) {
    clearSource();
    success('Standards source reset to default (unset).');
    return EXIT.ok;
  }
  if (rest[0]) {
    setSource(rest[0]);
    success(`Standards source set → ${cyan(rest[0])}`);
    return EXIT.ok;
  }
  const current = getSource();
  info(current ? `${dim('source:')} ${current}` : dim('  No standards source set. Use: sooft agent source <source>'));
  return EXIT.ok;
}
