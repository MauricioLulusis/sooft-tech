import { EXIT } from '../constants.mjs';
import { baseRoot } from '../agents.mjs';
import { readManifest, listPacks } from '../manifest.mjs';
import { info, heading, bullet } from '../ui.mjs';
import { cyan, dim, bold, green } from '../colors.mjs';

/** Show installed packs for this scope, with their agents and placement summary. */
export function listCommand(args) {
  const root = baseRoot(args.flags.global);
  const manifest = readManifest(root);
  const packs = listPacks(manifest);

  if (args.flags.json) {
    info(JSON.stringify({ root, packs }, null, 2));
    return EXIT.ok;
  }

  if (!packs.length) {
    info(dim(`  No Sooft packs installed here. Try ${cyan('sooft add <source>')}.`));
    return EXIT.ok;
  }

  info();
  heading(`  Installed packs ${dim('(' + packs.length + ')')}`);
  for (const p of packs) {
    info(`  ${bold(cyan(p.name))} ${dim('v' + p.version)}  ${dim('← ' + p.source)}`);
    for (const [agent, rec] of Object.entries(p.agents || {})) {
      const parts = [];
      if (rec.rules && rec.rules.length) parts.push(`${rec.rules.length} rule(s)`);
      if (rec.hooks && rec.hooks.length) parts.push(`hooks: ${rec.hooks.join(', ')}`);
      bullet(`${green(agent)} ${dim('— ' + (parts.join('; ') || 'no placements'))}`);
    }
  }
  info();
  return EXIT.ok;
}
