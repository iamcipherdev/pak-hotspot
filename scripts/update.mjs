#!/usr/bin/env node
/**
 * update.mjs — writes data/news.json for Pak Hotspot.
 *
 * Usage:
 *   node scripts/update.mjs stories.json
 *   cat stories.json | node scripts/update.mjs
 *
 * Input JSON shape:
 *   {
 *     "tech":     [{ "title": "...", "summary": "...", "url": "https://...", "source": "Name" }],
 *     "pakistan": [{ "title": "...", "summary": "...", "url": "https://...", "source": "Name" }]
 *   }
 *
 * The script validates the schema, stamps `updated_at` with the current
 * time (Asia/Karachi), and writes data/news.json atomically.
 * A daily cron generates the stories JSON (verified against real outlets)
 * and calls this script, then commits + pushes.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'news.json');

function fail(msg) {
  console.error('update.mjs: ' + msg);
  process.exit(1);
}

async function readInput() {
  if (process.argv[2]) {
    try {
      return readFileSync(process.argv[2], 'utf8');
    } catch (e) {
      fail('cannot read input file: ' + e.message);
    }
  }
  // stdin
  let chunks = '';
  for await (const c of process.stdin) chunks += c;
  return chunks;
}

function validateSection(name, arr) {
  if (!Array.isArray(arr) || arr.length === 0) fail(`"${name}" must be a non-empty array`);
  arr.forEach((s, i) => {
    for (const k of ['title', 'summary', 'url', 'source']) {
      if (typeof s[k] !== 'string' || !s[k].trim()) fail(`"${name}[${i}].${k}" must be a non-empty string`);
    }
    if (!/^https?:\/\//.test(s.url)) fail(`"${name}[${i}].url" must be an http(s) URL`);
  });
}

const raw = await readInput();
let input;
try {
  input = JSON.parse(raw);
} catch (e) {
  fail('input is not valid JSON: ' + e.message);
}

validateSection('tech', input.tech);
validateSection('pakistan', input.pakistan);

// Stamp in Asia/Karachi, ISO 8601 with offset
const now = new Date();
const pkt = new Date(now.getTime() + 5 * 3600 * 1000);
const updated_at = pkt.toISOString().replace('Z', '+05:00').slice(0, 19) + '+05:00';

const out = {
  updated_at,
  tech: input.tech,
  pakistan: input.pakistan,
};

// Atomic write: temp file + rename
const tmp = OUT + '.tmp';
writeFileSync(tmp, JSON.stringify(out, null, 2) + '\n');
renameSync(tmp, OUT);

console.log(`wrote ${OUT}: ${out.tech.length} tech + ${out.pakistan.length} pakistan stories @ ${updated_at}`);
