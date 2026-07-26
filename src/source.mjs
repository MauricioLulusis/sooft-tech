import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isDir, exists } from './util.mjs';

/**
 * Resolve a pack `source` to a local directory the caller can read.
 *
 * Supported forms:
 *   - local path:      ./packs/standards   /abs/path   ../thing
 *   - GitHub shorthand: owner/repo[/subdir][@ref]
 *   - any git remote:  https://…​.git  git@host:team/repo.git[#ref]
 *
 * Git sources are shallow-cloned with the user's own credentials into a temp
 * dir; we never prompt for or store tokens. Returns { dir, cleanup, kind }.
 */
export function resolveSource(source) {
  if (looksLocal(source)) {
    const dir = path.resolve(source);
    if (!isDir(dir)) throw new Error(`local source not found: ${source}`);
    return { dir, kind: 'local', ref: source, cleanup: () => {} };
  }

  const git = parseGit(source);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sooft-src-'));
  const cleanup = () => {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  };

  try {
    const args = ['clone', '--depth', '1'];
    if (git.ref) args.push('--branch', git.ref);
    args.push(git.url, tmp);
    execFileSync('git', args, { stdio: 'pipe' });
  } catch (err) {
    cleanup();
    const detail = (err.stderr && err.stderr.toString().trim()) || err.message;
    throw new Error(`git clone failed for ${git.url}: ${detail}`);
  }

  const dir = git.subdir ? path.join(tmp, git.subdir) : tmp;
  if (!isDir(dir)) {
    cleanup();
    throw new Error(`subdir not found in source: ${git.subdir}`);
  }
  return { dir, kind: 'git', ref: source, cleanup };
}

function looksLocal(source) {
  return (
    source.startsWith('.') ||
    source.startsWith('/') ||
    source.startsWith('~') ||
    /^[a-zA-Z]:[\\/]/.test(source) || // Windows drive path
    exists(path.resolve(source))
  );
}

/** Parse GitHub shorthand or a full git URL into { url, subdir, ref }. */
function parseGit(source) {
  // Full git URL (https or ssh); ref after `#`.
  if (/^(https?:\/\/|git@|ssh:\/\/)/.test(source)) {
    const [url, ref] = source.split('#');
    return { url, subdir: null, ref: ref || null };
  }

  // owner/repo[/subdir][@ref]
  let rest = source;
  let ref = null;
  const at = rest.lastIndexOf('@');
  if (at > 0) {
    ref = rest.slice(at + 1);
    rest = rest.slice(0, at);
  }
  const parts = rest.split('/');
  if (parts.length < 2) {
    throw new Error(`unrecognized source: "${source}" (use owner/repo, a git URL, or a local path)`);
  }
  const owner = parts[0];
  const repo = parts[1];
  const subdir = parts.slice(2).join('/') || null;
  return { url: `https://github.com/${owner}/${repo}.git`, subdir, ref };
}
