#!/usr/bin/env bun
/**
 * Strict 200-Line Code Boundary Enforcer
 *
 * Rules:
 * - Only counts non-empty, non-comment lines of code (SLOC).
 * - Target limit: 200 effective lines per file.
 * - Targets: Rust (*.rs) and TypeScript/React (*.ts, *.tsx).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const MAX_SLOC = 200;
const ROOT_DIR = process.cwd();

const SCAN_DIRS = [
  join(ROOT_DIR, 'crates'),
  join(ROOT_DIR, 'frontend', 'src'),
  join(ROOT_DIR, 'scripts'),
];

const IGNORE_PATTERNS = ['target', 'node_modules', 'generated', 'dist', '.git'];

function isIgnored(path: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => path.includes(pattern));
}

function isCommentOrEmpty(line: string): boolean {
  if (!line) return true;
  return (
    line.startsWith('//') ||
    line.startsWith('#') ||
    (line.startsWith('{/*') && line.endsWith('*/}'))
  );
}

function countSloc(content: string): number {
  const lines = content.split('\n');
  let sloc = 0;
  let inBlockComment = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) inBlockComment = true;
      continue;
    }
    if (!isCommentOrEmpty(line)) {
      sloc++;
    }
  }

  return sloc;
}

function collectFiles(dir: string, fileList: string[] = []): string[] {
  if (isIgnored(dir)) return fileList;

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        collectFiles(fullPath, fileList);
      } else if (['.rs', '.ts', '.tsx'].includes(extname(fullPath)) && !isIgnored(fullPath)) {
        fileList.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist yet during incremental setup
  }

  return fileList;
}

function run(): void {
  console.log('🔍 Checking 200-Line Code Limit (ignoring blank lines and comments)...');
  const allFiles = SCAN_DIRS.flatMap((dir) => collectFiles(dir));

  let failures = 0;
  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    const sloc = countSloc(content);
    const rel = relative(ROOT_DIR, file);

    if (sloc > MAX_SLOC) {
      console.error(`❌ VIOLATION: ${rel} has ${sloc} SLOC (limit is ${MAX_SLOC})`);
      failures++;
    } else {
      console.log(`  ✓ ${rel.padEnd(45)} ${sloc.toString().padStart(4)} / ${MAX_SLOC} SLOC`);
    }
  }

  console.log(`\n📊 Scanned ${allFiles.length} files.`);
  if (failures > 0) {
    console.error(`\n🚨 Failed: ${failures} file(s) exceeded the ${MAX_SLOC} SLOC limit!`);
    process.exit(1);
  }
  console.log(`✨ All ${allFiles.length} files adhere to the <= ${MAX_SLOC} SLOC rule!`);
}

run();
