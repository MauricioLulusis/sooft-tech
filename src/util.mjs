import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

export function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function writeJson(p, data) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

export function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

export function writeText(p, data) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, data);
}

export function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

/** Recursively copy a directory tree (files + subdirs). */
export function copyDir(from, to) {
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else if (entry.isFile()) copyFile(src, dest);
  }
}

/** Recursively remove a directory. Best-effort, silent. */
export function removeDir(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export function listDirs(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export function listFiles(p, ext) {
  try {
    return fs
      .readdirSync(p, { withFileTypes: true })
      .filter((e) => e.isFile() && (!ext || e.name.endsWith(ext)))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export function removeFile(p) {
  try {
    fs.rmSync(p, { force: true });
    return true;
  } catch {
    return false;
  }
}

/** Remove a directory if it exists and is now empty. Best-effort, silent. */
export function pruneEmptyDir(p) {
  try {
    if (isDir(p) && fs.readdirSync(p).length === 0) {
      fs.rmdirSync(p);
    }
  } catch {
    /* ignore */
  }
}

export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function hashFile(p) {
  return sha256(fs.readFileSync(p));
}

/** Home directory for `--global` placement. */
export function homeDir() {
  return process.env.HOME || process.env.USERPROFILE || process.cwd();
}
