import path from 'node:path';
import { exists } from './util.mjs';
import { TOOLS, DEFAULT_TOOLS } from './constants.mjs';

export function knownTools() {
  return Object.keys(TOOLS);
}

export function toolConfig(key) {
  const cfg = TOOLS[key];
  if (!cfg) throw new Error(`unknown tool "${key}" (known: ${knownTools().join(', ')})`);
  return cfg;
}

/** Detect which tools are present under `root` by their marker files/dirs. */
export function detectTools(root) {
  return Object.entries(TOOLS)
    .filter(([, cfg]) => cfg.detect.some((m) => exists(path.join(root, m))))
    .map(([key]) => key);
}

/**
 * Decide target tools: explicit `--agent` wins; `--all` forces every known tool;
 * otherwise auto-detect; otherwise fall back to the default set (Claude + Copilot).
 */
export function resolveToolTargets({ explicit, all, root }) {
  if (all) return knownTools();
  if (explicit && explicit.length) {
    for (const t of explicit) toolConfig(t); // validate
    return explicit;
  }
  const detected = detectTools(root);
  return detected.length ? detected : DEFAULT_TOOLS;
}

/** Absolute placement paths for a tool under `root` (only the keys it supports). */
export function toolPaths(key, root) {
  const cfg = toolConfig(key);
  const abs = (rel) => (rel ? path.join(root, rel) : null);
  return {
    key,
    label: cfg.label,
    skillsDir: abs(cfg.skillsDir),
    agentsDir: abs(cfg.agentsDir),
    instructions: abs(cfg.instructions),
    promptsDir: abs(cfg.promptsDir),
    hooksDir: abs(cfg.hooksDir),
    rulesFile: abs(cfg.rulesFile),
  };
}
