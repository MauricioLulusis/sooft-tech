import { banner } from './banner.mjs';
import { info } from './ui.mjs';
import { bold, cyan, dim } from './colors.mjs';
import { BRAND } from './constants.mjs';

const COMMANDS = [
  ['init [name]', 'Scaffold a Sooft asset pack (rules + hooks) to publish'],
  ['add <source>', 'Install a pack from owner/repo, a git URL, or a local path'],
  ['list', 'List installed packs and where they were placed'],
  ['check', 'Verify placed files still match the manifest (drift)'],
  ['remove <name>', 'Remove exactly what a pack placed'],
  ['doctor', 'Environment + workspace health check'],
];

const FLAGS = [
  ['-g, --global', 'Operate on the user home scope instead of this repo'],
  ['--agent <name>', 'Target a specific agent (claude, cursor) — repeatable'],
  ['-y, --yes', 'Skip the approval prompt (automation)'],
  ['--dry-run', 'Print the plan and write nothing'],
  ['--json', 'Machine-readable output where supported'],
  ['--no-banner', 'Hide the wordmark banner'],
  ['-v, --version', 'Print version'],
  ['-h, --help', 'Show this help'],
];

export function printHelp(version) {
  banner(version, true);
  info(`  ${dim(BRAND.tagline + ' — distribute rules & hooks to any AI coding agent.')}`);
  info();
  info(`  ${bold('Usage')}  ${cyan('sooft')} <command> [options]`);
  info();
  info(`  ${bold('Commands')}`);
  for (const [name, desc] of COMMANDS) info(`    ${cyan(name.padEnd(16))} ${dim(desc)}`);
  info();
  info(`  ${bold('Options')}`);
  for (const [name, desc] of FLAGS) info(`    ${name.padEnd(18)} ${dim(desc)}`);
  info();
  info(`  ${dim('Docs: ' + BRAND.url)}`);
  info();
}
