/**
 * Tiny zero-dependency ANSI color helper.
 *
 * Honors NO_COLOR and non-TTY output by default, and supports 24-bit
 * truecolor (with a graceful no-op when color is disabled). Kept dependency
 * free on purpose: the whole CLI must run with `node bin/sooft.mjs` out of the
 * box, no install step.
 */

let enabled = computeEnabled();

function computeEnabled() {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return Boolean(process.stdout && process.stdout.isTTY);
}

/** Force-enable/disable color (e.g. the help screen forces it even when piped). */
export function setColorEnabled(value) {
  enabled = Boolean(value);
}

export function colorEnabled() {
  return enabled;
}

const wrap = (open, close) => (str) => (enabled ? `\x1b[${open}m${str}\x1b[${close}m` : String(str));

export const reset = wrap(0, 0);
export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const italic = wrap(3, 23);
export const underline = wrap(4, 24);

export const red = wrap(31, 39);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const blue = wrap(34, 39);
export const magenta = wrap(35, 39);
export const cyan = wrap(36, 39);
export const gray = wrap(90, 39);

/** 24-bit truecolor foreground. */
export function rgb(r, g, b, str) {
  if (!enabled) return String(str);
  return `\x1b[38;2;${r};${g};${b}m${str}\x1b[39m`;
}

/** Linear interpolation between two RGB colors, `t` in [0, 1]. */
export function lerpRgb(from, to, t) {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
}
