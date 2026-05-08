#!/usr/bin/env node
// Smoke tests for ai-team-docs CLI.
// Zero-dep: spawns the CLI and asserts on stdout / stderr / exit code.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'cli.mjs');

let pass = 0;
let fail = 0;
const failures = [];

function run(args, opts = {}) {
  return spawnSync('node', [CLI, ...args], {
    encoding: 'utf8',
    cwd: opts.cwd || process.cwd(),
    env: { ...process.env, ...opts.env },
  });
}

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`  ✓ ${name}\n`);
    pass++;
  } catch (e) {
    process.stdout.write(`  ✗ ${name}\n    ${e.message}\n`);
    fail++;
    failures.push({ name, err: e });
  }
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'atd-test-'));
}

console.log('Running ai-team-docs tests...\n');

// --- basic commands ---
test('--help prints usage and exits 0', () => {
  const r = run(['--help']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /ai-team-docs v/);
  assert.match(r.stdout, /命令：/);
});

test('-h is alias for --help', () => {
  const r = run(['-h']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /命令：/);
});

test('version prints version', () => {
  const r = run(['version']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^ai-team-docs v\d+\.\d+\.\d+/);
});

test('list prints all 8 templates', () => {
  const r = run(['list']);
  assert.equal(r.status, 0);
  for (const t of ['prd', 'tech-spec', 'adr', 'table', 'glossary', 'architecture', 'readme-prd-hub', 'readme-impl']) {
    assert.match(r.stdout, new RegExp(`\\b${t}\\b`), `missing template ${t}`);
  }
});

test('show prd prints PRD template', () => {
  const r = run(['show', 'prd']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /\{Status Prefix\}/);
  assert.match(r.stdout, /跨端范围 & 实现追踪/);
});

test('show <unknown> exits 1 with error', () => {
  const r = run(['show', 'doesnotexist']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /未知模板/);
});

test('docs lists methodology docs', () => {
  const r = run(['docs']);
  assert.equal(r.status, 0);
  for (const d of ['methodology', 'why-ai-friendly', 'source-of-truth', 'cross-team-linking', 'sync-and-linking']) {
    assert.match(r.stdout, new RegExp(d));
  }
});

test('docs source-of-truth prints content', () => {
  const r = run(['docs', 'source-of-truth']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Source of Truth/);
});

test('unknown command exits 1', () => {
  const r = run(['nonexistent']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /未知命令/);
});

// --- argv parser regression: --key=value (Unix std) ---
test('init --type=impl works (--key=value form)', () => {
  const dir = tmpDir();
  const r = run(['init', 'out', '--type=impl'], { cwd: dir });
  assert.equal(r.status, 0, `expected exit 0, got ${r.status}. stderr:\n${r.stderr}`);
  assert.ok(fs.existsSync(path.join(dir, 'out', 'README.md')));
  assert.ok(fs.existsSync(path.join(dir, 'out', 'features', '_tech-spec-template.md')));
  assert.ok(!fs.existsSync(path.join(dir, 'out', 'prd-hub')), 'should not include prd-hub when --type=impl');
});

test('init --type prd-hub works (--key value form)', () => {
  const dir = tmpDir();
  const r = run(['init', 'out', '--type', 'prd-hub'], { cwd: dir });
  assert.equal(r.status, 0);
  assert.ok(fs.existsSync(path.join(dir, 'out', '_PRD-template.md')));
  assert.ok(!fs.existsSync(path.join(dir, 'out', 'features')), 'should not include features when --type=prd-hub');
});

test('init defaults to type=all', () => {
  const dir = tmpDir();
  const r = run(['init', 'out'], { cwd: dir });
  assert.equal(r.status, 0);
  assert.ok(fs.existsSync(path.join(dir, 'out', 'prd-hub', 'README.md')));
  assert.ok(fs.existsSync(path.join(dir, 'out', 'impl-wiki', 'README.md')));
});

test('init --force re-writes files', () => {
  const dir = tmpDir();
  // Create once
  run(['init', 'out', '--type=prd-hub'], { cwd: dir });
  const f = path.join(dir, 'out', 'README.md');
  fs.writeFileSync(f, 'CUSTOM');
  // Re-init without --force: should skip
  const r1 = run(['init', 'out', '--type=prd-hub'], { cwd: dir });
  assert.equal(r1.status, 0);
  assert.equal(fs.readFileSync(f, 'utf8'), 'CUSTOM', '--force not specified should skip existing file');
  // Re-init with --force: should overwrite
  const r2 = run(['init', 'out', '--type=prd-hub', '--force'], { cwd: dir });
  assert.equal(r2.status, 0);
  assert.notEqual(fs.readFileSync(f, 'utf8'), 'CUSTOM', '--force should overwrite');
});

// --- links commands ---
test('links init creates manifest and exits 0', () => {
  const dir = tmpDir();
  const r = run(['links', 'init'], { cwd: dir });
  assert.equal(r.status, 0);
  const mf = path.join(dir, '.ai-team-docs-links.json');
  assert.ok(fs.existsSync(mf));
  const json = JSON.parse(fs.readFileSync(mf, 'utf8'));
  assert.equal(json.version, 1);
  assert.ok(Array.isArray(json.links));
  assert.match(json.$schema, /\.json$/);
});

test('links init twice exits 1 (refuses overwrite)', () => {
  const dir = tmpDir();
  run(['links', 'init'], { cwd: dir });
  const r = run(['links', 'init'], { cwd: dir });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /已存在/);
});

test('links list prints starter entries', () => {
  const dir = tmpDir();
  run(['links', 'init'], { cwd: dir });
  const r = run(['links', 'list'], { cwd: dir });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /共 2 条链接/);
  assert.match(r.stdout, /example-architecture/);
});

test('links list --json outputs valid JSON', () => {
  const dir = tmpDir();
  run(['links', 'init'], { cwd: dir });
  const r = run(['links', 'list', '--json'], { cwd: dir });
  assert.equal(r.status, 0);
  const obj = JSON.parse(r.stdout);
  assert.equal(obj.count, 2);
  assert.ok(Array.isArray(obj.links));
});

test('links check on starter entries fails (placeholders)', () => {
  const dir = tmpDir();
  run(['links', 'init'], { cwd: dir });
  const r = run(['links', 'check'], { cwd: dir });
  assert.equal(r.status, 1, 'check should exit 1 on placeholder URLs');
  assert.match(r.stdout, /Fail: 2/);
});

test('links check accepts real Lark URL + valid repo path', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'README.md'), '# test');
  fs.writeFileSync(
    path.join(dir, '.ai-team-docs-links.json'),
    JSON.stringify({
      version: 1,
      links: [
        {
          id: 'arch',
          title: 'Architecture',
          wiki: 'https://example.larksuite.com/wiki/AbcDefGhiJklMnoPq',
          repo: ['README.md'],
        },
      ],
    })
  );
  const r = run(['links', 'check'], { cwd: dir });
  assert.equal(r.status, 0, `expected pass; got\nstdout:${r.stdout}\nstderr:${r.stderr}`);
  assert.match(r.stdout, /Pass: 1/);
});

test('links check warns on unrecognized but valid URL', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, '.ai-team-docs-links.json'), JSON.stringify({
    version: 1,
    links: [{ id: 'x', title: 'X', wiki: 'https://random-site.com/page', repo: null }],
  }));
  const r = run(['links', 'check'], { cwd: dir });
  assert.equal(r.status, 0, 'unrecognized URL should warn, not fail');
  assert.match(r.stdout, /Warn: 1/);
});

test('links check fails on duplicate ids', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, '.ai-team-docs-links.json'), JSON.stringify({
    version: 1,
    links: [
      { id: 'dup', title: 'A', wiki: 'https://example.larksuite.com/wiki/A1' },
      { id: 'dup', title: 'B', wiki: 'https://example.larksuite.com/wiki/B1' },
    ],
  }));
  const r = run(['links', 'check'], { cwd: dir });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /duplicate id/);
});

test('links check fails on missing repo path', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, '.ai-team-docs-links.json'), JSON.stringify({
    version: 1,
    links: [{ id: 'x', title: 'X', wiki: 'https://example.larksuite.com/wiki/abc', repo: ['nonexistent.md'] }],
  }));
  const r = run(['links', 'check'], { cwd: dir });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /repo path missing/);
});

test('loadLinks finds manifest in parent dir', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, '.ai-team-docs-links.json'), JSON.stringify({
    version: 1,
    links: [{ id: 'a', title: 'A', wiki: 'https://example.larksuite.com/wiki/abc' }],
  }));
  const sub = path.join(dir, 'a', 'b', 'c');
  fs.mkdirSync(sub, { recursive: true });
  const r = run(['links', 'list'], { cwd: sub });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /共 1 条链接/);
});

test('JSON schema file exists and is valid JSON', () => {
  const schemaPath = path.resolve(__dirname, '..', 'schema', 'links.schema.json');
  assert.ok(fs.existsSync(schemaPath), 'schema/links.schema.json must exist');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.equal(schema.title, 'ai-team-docs Wiki ↔ Repo Links Manifest');
});

test('links check resolves repo paths relative to manifest dir, not CWD', () => {
  // Regression test: previously `fs.existsSync(r)` used CWD, so running from
  // a subdirectory caused all repo path checks to false-positive fail.
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'README.md'), '# project root file');
  fs.writeFileSync(path.join(dir, '.ai-team-docs-links.json'), JSON.stringify({
    version: 1,
    links: [{ id: 'r', title: 'Root file', wiki: 'https://example.larksuite.com/wiki/abc', repo: ['README.md'] }],
  }));
  const sub = path.join(dir, 'a', 'b', 'c');
  fs.mkdirSync(sub, { recursive: true });
  // Run from subdirectory — CWD is `sub`, but README.md lives in manifest dir.
  const r = run(['links', 'check'], { cwd: sub });
  assert.equal(r.status, 0, `expected pass; CWD-based path check would falsely fail. stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /Pass: 1/);
});

test('examples/ directory is non-empty (no dead doc links)', () => {
  const examplesDir = path.resolve(__dirname, '..', 'examples');
  assert.ok(fs.existsSync(examplesDir), 'examples/ must exist (referenced by docs/methodology.md and package.json files)');
  const entries = fs.readdirSync(examplesDir).filter((f) => !f.startsWith('.'));
  assert.ok(entries.length > 0, `examples/ must contain at least one file; got ${entries.length}`);
});

// --- summary ---
console.log(`\n${pass + fail} tests, ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
