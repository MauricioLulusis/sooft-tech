import { banner, disableBanner } from './banner.mjs';
import { setColorEnabled } from './colors.mjs';
import { printHelp } from './help.mjs';
import { errorMsg } from './ui.mjs';
import { EXIT } from './constants.mjs';
import { VERSION } from './version.mjs';

import { initCommand } from './commands/init.mjs';
import { addCommand } from './commands/add.mjs';
import { listCommand } from './commands/list.mjs';
import { removeCommand } from './commands/remove.mjs';
import { checkCommand } from './commands/check.mjs';
import { doctorCommand } from './commands/doctor.mjs';

const COMMANDS = {
  init: initCommand,
  add: addCommand,
  list: listCommand,
  ls: listCommand,
  remove: removeCommand,
  rm: removeCommand,
  check: checkCommand,
  doctor: doctorCommand,
};

/**
 * Parse argv into { command, positional, flags }. A hand-rolled parser keeps the
 * CLI dependency-free; `--agent` is repeatable, everything else is a boolean or
 * single value.
 */
export function parseArgs(argv) {
  const flags = { agent: [] };
  const positional = [];
  let command = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        flags.help = true;
        break;
      case '-v':
      case '--version':
        flags.version = true;
        break;
      case '-g':
      case '--global':
        flags.global = true;
        break;
      case '-y':
      case '--yes':
        flags.yes = true;
        break;
      case '--dry-run':
        flags.dryRun = true;
        break;
      case '--json':
        flags.json = true;
        break;
      case '--no-banner':
        flags.noBanner = true;
        break;
      case '--agent':
        flags.agent.push(argv[++i]);
        break;
      default:
        if (arg.startsWith('--agent=')) flags.agent.push(arg.slice('--agent='.length));
        else if (arg.startsWith('-')) flags.unknown = arg;
        else if (!command) command = arg;
        else positional.push(arg);
    }
  }

  if (!flags.agent.length) delete flags.agent;
  return { command, positional, flags };
}

export async function run(argv) {
  const args = parseArgs(argv);

  if (args.flags.noBanner || process.env.SOOFT_NO_BANNER) disableBanner();
  if (process.env.FORCE_COLOR) setColorEnabled(true);

  if (args.flags.version) {
    console.log(VERSION);
    return EXIT.ok;
  }

  if (args.flags.help || !args.command) {
    printHelp(VERSION);
    return EXIT.ok;
  }

  if (args.flags.unknown) {
    errorMsg(`unknown option: ${args.flags.unknown}`);
    return EXIT.usage;
  }

  const handler = COMMANDS[args.command];
  if (!handler) {
    errorMsg(`unknown command: ${args.command}`);
    printHelp(VERSION);
    return EXIT.usage;
  }

  // Non-help commands still greet on an interactive TTY (skipped in agents/CI).
  banner(VERSION);
  const code = await handler(args);
  return typeof code === 'number' ? code : EXIT.ok;
}
