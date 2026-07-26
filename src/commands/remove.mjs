import path from 'node:path';
import { removeFile, pruneEmptyDir } from '../util.mjs';
import { EXIT } from '../constants.mjs';
import { baseRoot } from '../agents.mjs';
import { unmergeHooks } from '../merge.mjs';
import { readManifest, writeManifest, getPackRecord, removePackRecord } from '../manifest.mjs';
import { info, success, warn, step, bullet } from '../ui.mjs';
import { dim, red, bold } from '../colors.mjs';

/**
 * Remove exactly what a pack placed: its rule files and its stamped hook
 * groups, then its manifest record. Nothing else is touched.
 */
export function removeCommand(args) {
  const name = args.positional[0];
  if (!name) {
    warn('usage: sooft remove <pack-name>');
    return EXIT.usage;
  }

  const root = baseRoot(args.flags.global);
  const manifest = readManifest(root);
  const record = getPackRecord(manifest, name);
  if (!record) {
    warn(`pack "${name}" is not installed here.`);
    return EXIT.error;
  }

  step(`Removing ${bold(name)}`);
  for (const rec of Object.values(record.agents || {})) {
    for (const rule of rec.rules || []) {
      if (removeFile(rule.path)) bullet(`${red('-')} ${dim(path.relative(root, rule.path))}`);
      pruneEmptyDir(path.dirname(rule.path));
    }
    if (rec.settings && rec.hooks && rec.hooks.length) {
      const removed = unmergeHooks(rec.settings, name);
      if (removed.length) bullet(`${red('-')} ${dim('hooks from ' + path.relative(root, rec.settings))}`);
    }
  }

  removePackRecord(manifest, name);
  writeManifest(root, manifest);
  info();
  success(`Removed ${bold(name)}`);
  return EXIT.ok;
}
