import path from 'node:path';
import { exists, isDir, readJson } from './util.mjs';
import { PACK_FILE } from './constants.mjs';

/**
 * A Sooft asset pack is a directory with a `sooft.pack.json` manifest:
 *
 *   {
 *     "name": "sooft-standards",
 *     "version": "1.0.0",
 *     "description": "Sooft engineering conventions",
 *     "rules": ["rules/engineering.md"],   // markdown files distributed to agents
 *     "hooks": "hooks.json"                 // optional lifecycle hooks manifest
 *   }
 *
 * `load` validates the shape and resolves every referenced file, failing loud
 * on anything missing so a bad pack never places a half-installed mess.
 */
export function loadPack(dir) {
  const manifestPath = path.join(dir, PACK_FILE);
  if (!exists(manifestPath)) {
    throw new Error(`not a Sooft pack: no ${PACK_FILE} in ${dir}`);
  }

  let meta;
  try {
    meta = readJson(manifestPath);
  } catch (err) {
    throw new Error(`invalid ${PACK_FILE}: ${err.message}`);
  }

  if (!meta.name || typeof meta.name !== 'string') {
    throw new Error(`${PACK_FILE}: "name" is required`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(meta.name)) {
    throw new Error(`${PACK_FILE}: "name" must be lowercase-with-hyphens (got "${meta.name}")`);
  }

  const rules = [];
  for (const rel of meta.rules || []) {
    const abs = path.join(dir, rel);
    if (!exists(abs)) throw new Error(`${PACK_FILE}: rule file not found: ${rel}`);
    rules.push({ rel, abs, base: path.basename(rel) });
  }

  let hooks = null;
  if (meta.hooks) {
    const abs = path.join(dir, meta.hooks);
    if (!exists(abs)) throw new Error(`${PACK_FILE}: hooks file not found: ${meta.hooks}`);
    try {
      hooks = { rel: meta.hooks, abs, data: readJson(abs) };
    } catch (err) {
      throw new Error(`invalid hooks file ${meta.hooks}: ${err.message}`);
    }
  }

  return {
    dir,
    name: meta.name,
    version: meta.version || '0.0.0',
    description: meta.description || '',
    rules,
    hooks,
  };
}

export function isPackDir(dir) {
  return isDir(dir) && exists(path.join(dir, PACK_FILE));
}
