import path from 'node:path';
import { exists, homeDir } from './util.mjs';
import { AGENTS, DEFAULT_AGENT } from './constants.mjs';

/**
 * Resolve the base directory for placement: the current repo, or the user's
 * home directory when `--global`.
 */
export function baseRoot(global) {
  return global ? homeDir() : process.cwd();
}

/** All known agent keys (claude, cursor, …). */
export function knownAgents() {
  return Object.keys(AGENTS);
}

export function agentConfig(key) {
  const cfg = AGENTS[key];
  if (!cfg) throw new Error(`unknown agent "${key}" (known: ${knownAgents().join(', ')})`);
  return cfg;
}

/**
 * Detect which agents are present under `root` by their marker files. Returns
 * the list of detected agent keys; empty when none are found.
 */
export function detectAgents(root) {
  const found = [];
  for (const [key, cfg] of Object.entries(AGENTS)) {
    if (cfg.detect.some((marker) => exists(path.join(root, marker)))) {
      found.push(key);
    }
  }
  return found;
}

/**
 * Decide the target agents for a command: explicit `--agent` wins; otherwise
 * auto-detect; otherwise fall back to Claude Code (the default substrate).
 */
export function resolveTargets(explicit, root) {
  if (explicit && explicit.length) {
    for (const a of explicit) agentConfig(a); // validate
    return explicit;
  }
  const detected = detectAgents(root);
  return detected.length ? detected : [DEFAULT_AGENT];
}

/** Absolute placement paths for a given agent under `root`. */
export function agentPaths(key, root) {
  const cfg = agentConfig(key);
  return {
    label: cfg.label,
    rulesDir: path.join(root, cfg.rulesDir),
    rulesExt: cfg.rulesExt,
    settings: path.join(root, cfg.settings),
  };
}
