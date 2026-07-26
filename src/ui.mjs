import { green, yellow, red, cyan, dim, bold } from './colors.mjs';

/**
 * Whether we can safely show interactive prompts. The CLI frequently runs
 * inside agents (Claude/Cursor) and CI where stdin isn't a TTY — prompting
 * there hangs, so callers fall back to flag-driven, non-interactive behavior.
 */
export function isInteractive() {
  return Boolean(process.stdout.isTTY && process.stdin.isTTY) && !isCI();
}

export function isCI() {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.BUILDKITE ||
    process.env.JENKINS_URL
  );
}

export function info(msg = '') {
  console.log(msg);
}

export function heading(msg) {
  console.log(bold(msg));
}

export function success(msg) {
  console.log(`${green('✓')} ${msg}`);
}

export function warn(msg) {
  console.warn(`${yellow('!')} ${msg}`);
}

export function errorMsg(msg) {
  console.error(`${red('✗')} ${msg}`);
}

export function step(msg) {
  console.log(`${cyan('›')} ${msg}`);
}

export function bullet(msg) {
  console.log(`  ${dim('•')} ${msg}`);
}

/** Print a polished error and exit. */
export function fail(msg, code = 1) {
  errorMsg(msg);
  process.exit(code);
}

/**
 * Minimal yes/no prompt on stdin. Only called when `isInteractive()` is true.
 * Returns the default when the user just hits enter.
 */
export async function confirm(question, defaultYes = false) {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  process.stdout.write(`${cyan('?')} ${question} ${dim(hint)} `);
  return new Promise((resolve) => {
    const onData = (data) => {
      const answer = String(data).trim().toLowerCase();
      process.stdin.pause();
      process.stdin.off('data', onData);
      if (answer === '') return resolve(defaultYes);
      resolve(answer === 'y' || answer === 'yes');
    };
    process.stdin.resume();
    process.stdin.once('data', onData);
  });
}
