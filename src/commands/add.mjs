import path from 'node:path';
import { copyFile, readText, writeText, hashFile } from '../util.mjs';
import { EXIT } from '../constants.mjs';
import { resolveSource } from '../source.mjs';
import { loadPack } from '../pack.mjs';
import { baseRoot, resolveTargets, agentPaths } from '../agents.mjs';
import { mergeHooks } from '../merge.mjs';
import { readManifest, writeManifest, setPackRecord } from '../manifest.mjs';
import { info, success, warn, heading, bullet, step, fail, isInteractive, confirm } from '../ui.mjs';
import { cyan, dim, bold, green } from '../colors.mjs';

/**
 * Install a Sooft pack into the detected (or chosen) agents.
 *
 * Contract: always show the full plan first, then require approval before
 * touching anything — hooks are commands the agent will run, so nothing is
 * placed silently. `--yes` for automation, `--dry-run` to preview only.
 * Installs are additive and exactly reversible via `sooft remove`.
 */
export async function addCommand(args) {
  const source = args.positional[0];
  if (!source) {
    warn('usage: sooft add <owner/repo | git-url | local-path>');
    return EXIT.usage;
  }

  const global = args.flags.global;
  const root = baseRoot(global);
  const targets = resolveTargets(args.flags.agent, root);

  let resolved;
  try {
    step(`Resolving ${cyan(source)}`);
    resolved = resolveSource(source);
  } catch (err) {
    fail(err.message, EXIT.error);
  }

  try {
    const pack = loadPack(resolved.dir);
    const plan = buildPlan(pack, targets, root);
    printPlan(pack, plan, { global, dryRun: args.flags.dryRun });

    if (args.flags.dryRun) {
      info(dim('  dry run — nothing written.'));
      return EXIT.ok;
    }

    if (!args.flags.yes) {
      if (!isInteractive()) {
        warn('non-interactive: re-run with --yes to approve, or --dry-run to preview.');
        return EXIT.error;
      }
      const ok = await confirm('Apply this plan?', true);
      if (!ok) {
        info(dim('  aborted.'));
        return EXIT.error;
      }
    }

    const record = applyPlan(pack, plan);
    const manifest = readManifest(root);
    setPackRecord(manifest, pack.name, {
      version: pack.version,
      source: resolved.ref,
      installedAt: new Date().toISOString(),
      agents: record,
    });
    writeManifest(root, manifest);

    info();
    success(`Installed ${bold(pack.name)} ${dim('v' + pack.version)} → ${targets.join(', ')}`);
    return EXIT.ok;
  } catch (err) {
    fail(err.message, EXIT.error);
  } finally {
    resolved.cleanup();
  }
}

/** Compute every write the install will perform, per agent. Pure — no I/O writes. */
function buildPlan(pack, targets, root) {
  return targets.map((agent) => {
    const paths = agentPaths(agent, root);
    const rules = pack.rules.map((r) => {
      const stem = path.basename(r.base, path.extname(r.base));
      const dest = path.join(paths.rulesDir, `${pack.name}-${stem}${paths.rulesExt}`);
      return { from: r.abs, to: dest, rel: path.relative(root, dest) };
    });
    const hookEvents = pack.hooks ? Object.keys(pack.hooks.data.hooks || {}) : [];
    return {
      agent,
      label: paths.label,
      settings: paths.settings,
      settingsRel: path.relative(root, paths.settings),
      rules,
      hooks: pack.hooks,
      hookEvents,
    };
  });
}

function printPlan(pack, plan, { global, dryRun }) {
  info();
  heading(`  Plan — ${cyan(pack.name)} ${dim('v' + pack.version)}${global ? dim('  (global)') : ''}`);
  if (pack.description) info(`  ${dim(pack.description)}`);
  info();
  for (const t of plan) {
    info(`  ${bold(t.label)}`);
    for (const r of t.rules) bullet(`${green('rule')}  ${r.rel}`);
    if (t.hookEvents.length) {
      bullet(`${green('hooks')} merge into ${t.settingsRel} ${dim('(' + t.hookEvents.join(', ') + ')')}`);
    }
    if (!t.rules.length && !t.hookEvents.length) bullet(dim('nothing to place'));
  }
  info();
}

/** Execute the plan and return the per-agent record for the manifest. */
function applyPlan(pack, plan) {
  const record = {};
  for (const t of plan) {
    const rules = [];
    for (const r of t.rules) {
      // Rewrite extension-only for cursor; content is copied verbatim otherwise.
      if (path.extname(r.from) === path.extname(r.to)) {
        copyFile(r.from, r.to);
      } else {
        writeText(r.to, readText(r.from));
      }
      rules.push({ path: r.to, sha: hashFile(r.to) });
    }

    let hooks = [];
    if (t.hooks) {
      hooks = mergeHooks(t.settings, pack.name, t.hooks.data);
    }
    record[t.agent] = { settings: t.settings, rules, hooks };
  }
  return record;
}
