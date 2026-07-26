import { exists, hashFile } from '../util.mjs';
import { EXIT } from '../constants.mjs';
import { baseRoot } from '../agents.mjs';
import { readManifest, listPacks } from '../manifest.mjs';
import { info, heading, bullet, success, warn } from '../ui.mjs';
import { dim, green, yellow, red, bold, cyan } from '../colors.mjs';

/**
 * Verify installed packs still match what the manifest recorded: are the rule
 * files present, and do they still hash to the recorded content? Drift means a
 * placed file was edited or deleted after install.
 */
export function checkCommand(args) {
  const root = baseRoot(args.flags.global);
  const manifest = readManifest(root);
  const packs = listPacks(manifest);

  if (!packs.length) {
    info(dim('  No Sooft packs installed here.'));
    return EXIT.ok;
  }

  info();
  heading('  Check');
  let drift = 0;
  for (const p of packs) {
    const version = p.version ? ` ${dim('v' + p.version)}` : '';
    info(`  ${bold(cyan(p.name))}${version}`);
    for (const rec of Object.values(p.agents || {})) {
      for (const rule of rec.rules || []) {
        if (!exists(rule.path)) {
          bullet(`${red('missing')} ${dim(rule.path)}`);
          drift++;
        } else if (hashFile(rule.path) !== rule.sha) {
          bullet(`${yellow('modified')} ${dim(rule.path)}`);
          drift++;
        } else {
          bullet(`${green('ok')} ${dim(rule.path)}`);
        }
      }
    }
    for (const rec of Object.values(p.tools || {})) {
      for (const item of rec.paths || []) {
        if (!exists(item.path)) {
          bullet(`${red('missing')} ${dim(item.path)}`);
          drift++;
        } else if (item.sha && hashFile(item.path) !== item.sha) {
          bullet(`${yellow('modified')} ${dim(item.path)}`);
          drift++;
        } else {
          bullet(`${green('ok')} ${dim(item.path)}`);
        }
      }
    }
  }

  info();
  if (drift) {
    warn(`${drift} placement(s) drifted from the manifest. Re-run ${cyan('sooft add')} to restore.`);
    return EXIT.error;
  }
  success('All placements match the manifest.');
  return EXIT.ok;
}
