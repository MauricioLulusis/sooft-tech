import { rgb, dim, lerpRgb } from './colors.mjs';
import { BRAND, GRADIENT } from './constants.mjs';

/**
 * "SOOFT" in the ANSI Shadow figlet font. Printed at the start of interactive
 * runs and on the help screen — the wordmark the whole tool is built around.
 */
const WORDMARK = [
  '███████╗ ██████╗  ██████╗ ███████╗████████╗',
  '██╔════╝██╔═══██╗██╔═══██╗██╔════╝╚══██╔══╝',
  '███████╗██║   ██║██║   ██║█████╗     ██║   ',
  '╚════██║██║   ██║██║   ██║██╔══╝     ██║   ',
  '███████║╚██████╔╝╚██████╔╝██║        ██║   ',
  '╚══════╝ ╚═════╝  ╚═════╝ ╚═╝        ╚═╝   ',
];

let bannerDisabled = false;

export function disableBanner() {
  bannerDisabled = true;
}

function isInteractive() {
  return Boolean(process.stdout.isTTY);
}

function optedOut() {
  // NO_COLOR degrades color but must NOT hide the wordmark — the banner is the
  // brand. Only an explicit opt-out (env or --no-banner) suppresses it.
  return bannerDisabled || !!process.env.SOOFT_NO_BANNER;
}

/**
 * Print the Sooft wordmark + slogan.
 *
 * Skipped outside a TTY (agents/CI) so machine-readable output stays clean, and
 * when opted out via `SOOFT_NO_BANNER` / `NO_COLOR` / `--no-banner`. Pass
 * `force` for the help screen, which humans invoke deliberately even when piped.
 */
export function banner(version, force = false) {
  if (optedOut()) return;
  if (!force && !isInteractive()) return;

  const lines = WORDMARK;
  console.log();
  lines.forEach((line, i) => {
    const t = lines.length > 1 ? i / (lines.length - 1) : 0;
    const [r, g, b] = lerpRgb(GRADIENT.from, GRADIENT.to, t);
    console.log('  ' + rgb(r, g, b, line));
  });

  const slogan = `${BRAND.company} ${rgb(168, 132, 255, '·')} AI Engineering`;
  const tail = version ? `  ${dim('v' + version)}` : '';
  console.log('  ' + dim(slogan) + tail);
  console.log();
}
