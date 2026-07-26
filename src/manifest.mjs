import path from 'node:path';
import { exists, readJson, writeJson } from './util.mjs';
import { STATE_DIR, MANIFEST_FILE } from './constants.mjs';

/**
 * The manifest records exactly what Sooft placed under a root so `remove` is
 * precise and `list`/`check` can report without re-reading agent configs.
 *
 * Two record shapes share the same `packs` map, one per install path:
 *
 * - `sooft add` (asset packs): { version, source, installedAt,
 *   agents: { <agent>: { settings?, rules: [{ path, sha }], hooks: [<event>...] } } }
 * - `sooft agent install` (Sooft AI Rails, name === STANDARDS_PACK): { source,
 *   installedAt, tools: { <tool>: { paths: [{ path, kind: 'file'|'dir', sha? }] } } }
 *   (no top-level `version`; `sha` is only set for `kind: 'file'` entries — a
 *   whole-directory `skill` copy is checked for existence only.)
 *
 * `list`/`check`/`remove <name>` must handle both `agents` and `tools` on the
 * same record when either is present.
 */
export function manifestPath(root) {
  return path.join(root, STATE_DIR, MANIFEST_FILE);
}

export function readManifest(root) {
  const p = manifestPath(root);
  if (!exists(p)) return { version: 1, packs: {} };
  try {
    const data = readJson(p);
    if (!data.packs) data.packs = {};
    return data;
  } catch {
    return { version: 1, packs: {} };
  }
}

export function writeManifest(root, manifest) {
  writeJson(manifestPath(root), manifest);
}

export function getPackRecord(manifest, name) {
  return manifest.packs[name] || null;
}

export function setPackRecord(manifest, name, record) {
  manifest.packs[name] = record;
  return manifest;
}

export function removePackRecord(manifest, name) {
  delete manifest.packs[name];
  return manifest;
}

export function listPacks(manifest) {
  return Object.entries(manifest.packs).map(([name, rec]) => ({ name, ...rec }));
}
