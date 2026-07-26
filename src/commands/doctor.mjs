import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { exists } from '../util.mjs';
import { EXIT, STATE_DIR, AGENTS } from '../constants.mjs';
import { baseRoot, detectAgents } from '../agents.mjs';
import { readManifest, listPacks } from '../manifest.mjs';
import { info, heading, bullet, success, warn } from '../ui.mjs';
import { dim, green, yellow, cyan, bold } from '../colors.mjs';

/** Environment + workspace health check. Never fails hard — it reports. */
export function doctorCommand(args) {
  const root = baseRoot(args.flags.global);
  info();
  heading('  Doctor');

  // Runtime
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const nodeOk = nodeMajor >= 18;
  line(nodeOk, `Node ${process.versions.node}`, nodeOk ? '' : 'requires >= 18');

  // git (needed for remote sources)
  let gitVer = '';
  try {
    gitVer = execFileSync('git', ['--version'], { stdio: 'pipe' }).toString().trim();
  } catch {
    /* not installed */
  }
  line(!!gitVer, gitVer || 'git', gitVer ? '' : 'not found — remote sources unavailable');

  // Detected agents
  const detected = detectAgents(root);
  info();
  heading('  Agents');
  for (const [key, cfg] of Object.entries(AGENTS)) {
    const present = detected.includes(key);
    bullet(`${present ? green('detected') : dim('—       ')} ${bold(cfg.label)} ${dim('(' + key + ')')}`);
  }

  // Installed packs
  const packs = listPacks(readManifest(root));
  info();
  heading('  Workspace');
  bullet(`${exists(path.join(root, STATE_DIR)) ? green('yes') : dim('no ')} ${dim(STATE_DIR + '/ state')}`);
  bullet(`${packs.length ? green(String(packs.length)) : dim('0')} ${dim('installed pack(s)')}`);

  info();
  if (nodeOk) success('Ready.');
  else warn(`Update Node to >= 18. Then re-run ${cyan('sooft doctor')}.`);
  info();
  return EXIT.ok;
}

function line(ok, label, note) {
  const mark = ok ? green('✓') : yellow('!');
  bullet(`${mark} ${label}${note ? '  ' + dim(note) : ''}`);
}
