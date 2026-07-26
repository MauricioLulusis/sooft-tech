import path from 'node:path';
import { exists, writeJson, writeText } from '../util.mjs';
import { PACK_FILE, EXIT } from '../constants.mjs';
import { success, info, warn, heading, bullet, step } from '../ui.mjs';
import { cyan, dim } from '../colors.mjs';

/**
 * Scaffold a Sooft asset pack — the source you publish to a git repo and then
 * `sooft add` from anywhere. Creates the pack manifest, one example rule, and
 * an example lifecycle hook.
 */
export function initCommand(args) {
  const name = args.positional[0] || 'sooft-standards';
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    warn(`pack name must be lowercase-with-hyphens — got "${name}"`);
    return EXIT.usage;
  }

  const dir = args.positional[0] ? path.resolve(name) : process.cwd();
  const manifestPath = path.join(dir, PACK_FILE);
  if (exists(manifestPath) && !args.flags.yes) {
    warn(`${PACK_FILE} already exists in ${dir} — pass --yes to overwrite`);
    return EXIT.error;
  }

  step(`Scaffolding pack ${cyan(name)}`);

  writeJson(manifestPath, {
    name,
    version: '0.1.0',
    description: 'Sooft engineering conventions for AI coding agents',
    rules: ['rules/engineering.md'],
    hooks: 'hooks.json',
  });

  writeText(path.join(dir, 'rules', 'engineering.md'), RULE_TEMPLATE);
  writeJson(path.join(dir, 'hooks.json'), HOOKS_TEMPLATE);

  info();
  success(`Created ${cyan(name)}`);
  heading('  Files');
  bullet(dim(PACK_FILE));
  bullet(dim('rules/engineering.md'));
  bullet(dim('hooks.json'));
  info();
  info(`  Next: ${cyan('sooft add ' + (args.positional[0] ? './' + name : '.'))}`);
  info();
  return EXIT.ok;
}

const RULE_TEMPLATE = `# Sooft Engineering Standards

> Distributed to every AI coding agent on the team via \`sooft\`.

## Principles

- Prefer clarity over cleverness. Code is read far more than it is written.
- Small, reversible changes. Ship behind flags when the blast radius is large.
- Tests describe intent. A failing test should read like a bug report.

## Conventions

- File naming: lowercase-with-hyphens.
- Commits: conventional (\`feat:\`, \`fix:\`, \`test:\`, \`docs:\`).
- No secrets in code, logs, or prompts — ever.

## AI Engineering

- Treat prompts and evals as first-class, versioned artifacts.
- Validate model output before acting on it; never trust it blindly.
- Keep a human in the loop for anything irreversible or outward-facing.
`;

const HOOKS_TEMPLATE = {
  hooks: {
    SessionStart: [
      {
        hooks: [{ type: 'prompt', prompt: 'Follow the Sooft engineering standards in this repo.' }],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Write|Edit',
        hooks: [{ type: 'prompt', prompt: 'Verify the file you just wrote follows Sooft conventions.' }],
      },
    ],
  },
};
