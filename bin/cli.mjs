#!/usr/bin/env node
// ai-team-docs CLI — zero-dep, Node 18+, ESM.
// AI-era cross-team documentation conventions.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, '..');

const TEMPLATES_DIR = path.join(PKG_ROOT, 'templates');
const DOCS_DIR = path.join(PKG_ROOT, 'docs');
const README_PATH = path.join(PKG_ROOT, 'README.md');
const PKG_JSON_PATH = path.join(PKG_ROOT, 'package.json');

const LINKS_FILE = '.ai-team-docs-links.json';

const TEMPLATE_MAP = {
  prd: 'PRD.md',
  'tech-spec': 'tech-spec.md',
  spec: 'tech-spec.md',
  adr: 'ADR.md',
  table: 'table-design.md',
  'table-design': 'table-design.md',
  glossary: 'glossary.md',
  architecture: 'architecture-overview.md',
  'arch-overview': 'architecture-overview.md',
  'readme-prd-hub': 'README-prd-hub.md',
  'readme-impl': 'README-impl-wiki.md',
};

const TEMPLATE_DESCRIPTIONS = {
  prd: 'PRD（产品需求文档）模板',
  'tech-spec': '技术方案（实现方案）模板',
  adr: 'ADR Log（架构决策日志）模板',
  table: '数据库表设计模板',
  glossary: '术语表模板',
  architecture: '架构总览模板',
  'readme-prd-hub': 'PRD Hub 根 README',
  'readme-impl': '实现方案 wiki 根 README',
};

function readPkg() {
  return JSON.parse(fs.readFileSync(PKG_JSON_PATH, 'utf8'));
}

function help() {
  const pkg = readPkg();
  return `ai-team-docs v${pkg.version}
${pkg.description}

用法：
  ai-team-docs <command> [options]

命令：
  methodology              打印方法论 README（推荐先读）
  docs                     列出方法论 docs
  docs <name>              查看某篇 doc（methodology / why-ai-friendly / source-of-truth / cross-team-linking / sync-and-linking）
  list                     列出可用模板
  show <template>          查看模板内容（不写文件）
  init [target]            scaffold 模板到目标目录（默认 ./docs/）
       --type prd-hub|impl|all   默认 all
       --force                   覆盖已存在文件
  links                    显示 links 子命令帮助
  links init               在当前目录创建 .ai-team-docs-links.json
  links list               列出当前 repo 的 wiki↔repo 链接清单
  links show <id>          查看单条链接详情
  links check              校验：repo 路径存在 + wiki URL 有效（不 fetch，仅格式校验）
  version                  显示版本
  help, --help, -h         显示本帮助

模板 short name：
  ${Object.keys(TEMPLATE_DESCRIPTIONS).map((k) => `  ${k.padEnd(20)} ${TEMPLATE_DESCRIPTIONS[k]}`).join('\n  ')}

示例：
  npx ai-team-docs methodology               # 看方法论
  npx ai-team-docs docs why-ai-friendly      # 看为什么扁平结构
  npx ai-team-docs show prd                  # 看 PRD 模板
  npx ai-team-docs init                      # scaffold 到 ./docs/
  npx ai-team-docs init my-project --type impl   # 只生成单端实现方案结构

更多文档：https://github.com/leeguooooo/ai-team-docs
`;
}

function cmdMethodology() {
  if (!fs.existsSync(README_PATH)) die(`README.md not found at ${README_PATH}`);
  process.stdout.write(fs.readFileSync(README_PATH, 'utf8'));
}

function listDocs() {
  if (!fs.existsSync(DOCS_DIR)) die('docs/ not found in package');
  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'));
  console.log('方法论文档（npx ai-team-docs docs <name>）：');
  for (const f of files) console.log(`  ${f.replace(/\.md$/, '')}`);
}

function cmdDocs(name) {
  if (!name) return listDocs();
  const file = path.join(DOCS_DIR, `${name}.md`);
  if (!fs.existsSync(file)) {
    console.error(`未找到 doc: ${name}`);
    listDocs();
    process.exit(1);
  }
  process.stdout.write(fs.readFileSync(file, 'utf8'));
}

function cmdList() {
  console.log('可用模板（npx ai-team-docs show <name>）：\n');
  for (const [name, desc] of Object.entries(TEMPLATE_DESCRIPTIONS)) {
    const filename = TEMPLATE_MAP[name];
    console.log(`  ${name.padEnd(18)} ${desc}`);
    console.log(`  ${''.padEnd(18)} → templates/${filename}\n`);
  }
}

function cmdShow(name) {
  if (!name) {
    console.error('错误：缺少模板名。');
    cmdList();
    process.exit(1);
  }
  const filename = TEMPLATE_MAP[name];
  if (!filename) {
    console.error(`未知模板：${name}`);
    cmdList();
    process.exit(1);
  }
  const file = path.join(TEMPLATES_DIR, filename);
  process.stdout.write(fs.readFileSync(file, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyTemplate(srcName, destPath, force) {
  const src = path.join(TEMPLATES_DIR, srcName);
  if (!fs.existsSync(src)) die(`source template missing: ${src}`);
  if (fs.existsSync(destPath) && !force) {
    console.log(`  ⏭  skip (exists): ${path.relative(process.cwd(), destPath)}`);
    return false;
  }
  ensureDir(path.dirname(destPath));
  fs.copyFileSync(src, destPath);
  console.log(`  ✓  ${path.relative(process.cwd(), destPath)}`);
  return true;
}

function cmdInit(args) {
  const target = args._[0] || 'docs';
  const type = args.type || 'all';
  const force = !!args.force;

  const targetAbs = path.resolve(process.cwd(), target);
  console.log(`Scaffolding ai-team-docs (type=${type}) to: ${targetAbs}\n`);

  if (!['all', 'prd-hub', 'impl'].includes(type)) {
    console.error(`未知 --type: ${type} (允许：all | prd-hub | impl)`);
    process.exit(1);
  }

  let written = 0;
  let skipped = 0;
  const tally = (ok) => (ok ? written++ : skipped++);

  if (type === 'all' || type === 'prd-hub') {
    const dir = type === 'all' ? path.join(targetAbs, 'prd-hub') : targetAbs;
    console.log(`PRD Hub → ${path.relative(process.cwd(), dir)}/`);
    tally(copyTemplate('README-prd-hub.md', path.join(dir, 'README.md'), force));
    tally(copyTemplate('PRD.md', path.join(dir, '_PRD-template.md'), force));
    console.log('');
  }

  if (type === 'all' || type === 'impl') {
    const dir = type === 'all' ? path.join(targetAbs, 'impl-wiki') : targetAbs;
    console.log(`Implementation wiki → ${path.relative(process.cwd(), dir)}/`);
    tally(copyTemplate('README-impl-wiki.md', path.join(dir, 'README.md'), force));
    // features/
    tally(copyTemplate('tech-spec.md', path.join(dir, 'features', '_tech-spec-template.md'), force));
    fs.writeFileSync(path.join(dir, 'features', '.gitkeep'), '');
    // reference/
    tally(copyTemplate('glossary.md', path.join(dir, 'reference', 'glossary.md'), force));
    tally(copyTemplate('architecture-overview.md', path.join(dir, 'reference', 'architecture-overview.md'), force));
    tally(copyTemplate('ADR.md', path.join(dir, 'reference', 'ADR-Log.md'), force));
    // tables/
    tally(copyTemplate('table-design.md', path.join(dir, 'reference', 'tables', '_table-design-template.md'), force));
    fs.writeFileSync(path.join(dir, 'reference', 'tables', '.gitkeep'), '');
    // ops/
    ensureDir(path.join(dir, 'ops'));
    fs.writeFileSync(path.join(dir, 'ops', '.gitkeep'), '');
    fs.writeFileSync(
      path.join(dir, 'ops', 'README.md'),
      `# ops\n\n按需在此目录加：\n- 环境与部署\n- Dashboard & Runbook 链接\n- 发布记录\n- 故障复盘（一次故障一篇）\n`
    );
    console.log(`  ✓  ${path.relative(process.cwd(), path.join(dir, 'ops', 'README.md'))}`);
    written++;
    console.log('');
  }

  console.log(`完成：${written} 个文件创建，${skipped} 个跳过（已存在；用 --force 覆盖）`);
  console.log('\n下一步：');
  console.log('  1. cd ' + path.relative(process.cwd(), targetAbs));
  console.log('  2. 阅读 README.md 了解协作规则');
  console.log('  3. 复制 _PRD-template.md / _tech-spec-template.md 创建第一篇文档');
  console.log('  4. (可选) npx ai-team-docs methodology  查看完整方法论');
}

function cmdVersion() {
  const pkg = readPkg();
  console.log(`ai-team-docs v${pkg.version}`);
}

// ---------- links subcommands ----------

function findLinksFile(startDir = process.cwd()) {
  // Walk up parent dirs looking for .ai-team-docs-links.json (until git root or filesystem root)
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;
  while (true) {
    const candidate = path.join(dir, LINKS_FILE);
    if (fs.existsSync(candidate)) return candidate;
    // Stop at git root (don't escape into parent project)
    if (fs.existsSync(path.join(dir, '.git'))) break;
    if (dir === root) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadLinks() {
  const file = findLinksFile();
  if (!file) {
    console.error(`未找到 ${LINKS_FILE}（在当前目录及其父目录中）。`);
    console.error(`先运行：ai-team-docs links init`);
    process.exit(1);
  }
  try {
    const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
    cfg._file = file; // attach for downstream relative-path resolution
    return cfg;
  } catch (e) {
    console.error(`${file} JSON 解析失败：${e.message}`);
    process.exit(1);
  }
}

function cmdLinksHelp() {
  console.log(`links 子命令：

  ai-team-docs links init     在当前目录创建 .ai-team-docs-links.json（含示例条目）
  ai-team-docs links list     列出所有链接（带 wiki URL + repo 路径）
  ai-team-docs links show <id>  查看单条链接详情（JSON）
  ai-team-docs links check    校验：repo 路径存在 + wiki URL 格式合法

设计说明：
  本命令只管理"地址关联"，不做内容同步。
  Wiki 和 repo 各为不同内容的真相来源（详见 docs/source-of-truth）。
  links.json 维护双向引用清单，CI 校验链接没腐烂。

更多：ai-team-docs docs sync-and-linking
`);
}

function cmdLinksInit() {
  if (fs.existsSync(LINKS_FILE)) {
    console.error(`${LINKS_FILE} 已存在。`);
    console.error(`如需重建，先备份并删除原文件，再运行 init。`);
    process.exit(1);
  }
  const starter = {
    $schema: 'https://raw.githubusercontent.com/leeguooooo/ai-team-docs/main/schema/links.schema.json',
    version: 1,
    description: 'Wiki ↔ Repo 链接清单。每条链接代表一个文档跨 wiki / repo 的双向引用关系。',
    links: [
      {
        id: 'example-architecture',
        title: '架构总览（示例条目，请替换或删除）',
        wiki: 'https://YOUR_TENANT.larksuite.com/wiki/REPLACE_WITH_NODE_TOKEN',
        repo: ['docs/ARCHITECTURE.md'],
        notes: '可选注释',
      },
      {
        id: 'example-adr',
        title: 'ADR Log（示例）',
        wiki: 'https://YOUR_TENANT.larksuite.com/wiki/REPLACE_WITH_NODE_TOKEN',
        repo: null,
      },
    ],
  };
  fs.writeFileSync(LINKS_FILE, JSON.stringify(starter, null, 2) + '\n');
  console.log(`✓ 创建 ${LINKS_FILE}`);
  console.log('');
  console.log('下一步：');
  console.log('  1. 编辑该文件，填入实际的 wiki URL 和 repo 路径');
  console.log('  2. 运行 `ai-team-docs links check` 校验');
  console.log('  3. 把这个文件提交到 git，作为 wiki/repo 的桥梁');
  console.log('  4. (建议) 在 CI 加一步 `ai-team-docs links check` 防腐烂');
}

function cmdLinksList(args) {
  const cfg = loadLinks();
  const links = cfg.links || [];
  if (args.json) {
    process.stdout.write(JSON.stringify({ count: links.length, links }, null, 2) + '\n');
    return;
  }
  console.log(`共 ${links.length} 条链接：\n`);
  for (const link of links) {
    const repos = Array.isArray(link.repo) ? link.repo : link.repo ? [link.repo] : [];
    console.log(`[${link.id}] ${link.title || ''}`);
    if (link.wiki) console.log(`  wiki: ${link.wiki}`);
    if (repos.length) console.log(`  repo: ${repos.join(', ')}`);
    if (link.notes) console.log(`  note: ${link.notes}`);
    console.log('');
  }
}

function cmdLinksShow(id) {
  if (!id) {
    console.error('用法：ai-team-docs links show <id>');
    process.exit(1);
  }
  const cfg = loadLinks();
  const link = (cfg.links || []).find((l) => l.id === id);
  if (!link) {
    console.error(`未找到 link：${id}`);
    process.exit(1);
  }
  console.log(JSON.stringify(link, null, 2));
}

// Known wiki URL patterns. URLs not matching any → flagged as "unrecognized" (warning, not error).
const WIKI_URL_PATTERNS = [
  /^https:\/\/[^/]+\.larksuite\.com\/wiki\/[A-Za-z0-9]+/, // Lark international
  /^https:\/\/[^/]+\.feishu\.cn\/wiki\/[A-Za-z0-9]+/, // Feishu CN
  /^https:\/\/[^/]+\.notion\.so\//, // Notion
  /^https:\/\/[^/]+\.notion\.site\//, // Notion public
  /^https:\/\/[^/]+\.atlassian\.net\/wiki\//, // Confluence
  /^https:\/\/github\.com\/[^/]+\/[^/]+\/(wiki|blob|tree)\//, // GitHub wiki / docs
];

function classifyWikiUrl(url) {
  if (!url || typeof url !== 'string') return { ok: false, reason: 'empty' };
  if (url.includes('REPLACE_WITH_NODE_TOKEN') || url.includes('YOUR_TENANT')) {
    return { ok: false, reason: 'unfilled placeholder' };
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'not a valid URL' };
  }
  if (!parsed.protocol.startsWith('http')) {
    return { ok: false, reason: 'protocol must be http(s)' };
  }
  for (const re of WIKI_URL_PATTERNS) {
    if (re.test(url)) return { ok: true, recognized: true };
  }
  return { ok: true, recognized: false }; // accept but warn
}

function cmdLinksCheck(args) {
  const cfg = loadLinks();
  const links = cfg.links || [];
  const json = !!args.json;
  const results = [];
  let pass = 0;
  let fail = 0;
  let warn = 0;
  const seen = new Set();
  for (const link of links) {
    const errs = [];
    const warnings = [];

    if (!link.id) errs.push('missing id');
    else if (seen.has(link.id)) errs.push(`duplicate id: ${link.id}`);
    else seen.add(link.id);

    if (!link.title) errs.push('missing title');

    const cls = classifyWikiUrl(link.wiki);
    if (!cls.ok) {
      errs.push(`wiki URL ${cls.reason}: ${link.wiki || '(empty)'}`);
    } else if (!cls.recognized) {
      warnings.push(`wiki URL accepted but not a recognized wiki/notion/confluence/github pattern: ${link.wiki}`);
    }

    const repos = Array.isArray(link.repo) ? link.repo : link.repo ? [link.repo] : [];
    for (const r of repos) {
      if (!fs.existsSync(r)) {
        errs.push(`repo path missing: ${r}`);
      }
    }

    const status = errs.length ? 'fail' : warnings.length ? 'warn' : 'pass';
    if (status === 'fail') fail++;
    else if (status === 'warn') warn++;
    else pass++;
    results.push({ id: link.id, title: link.title, status, errors: errs, warnings });
  }

  if (json) {
    process.stdout.write(
      JSON.stringify({ summary: { pass, warn, fail, total: links.length }, results }, null, 2) + '\n'
    );
    process.exit(fail > 0 ? 1 : 0);
  }

  console.log(`检查 ${links.length} 条链接（格式 + repo 路径存在）...\n`);
  for (const r of results) {
    const icon = r.status === 'fail' ? '✗' : r.status === 'warn' ? '⚠' : '✓';
    console.log(`${icon} [${r.id || '?'}] ${r.title || ''}`);
    for (const e of r.errors) console.log(`    - ERROR: ${e}`);
    for (const w of r.warnings) console.log(`    - WARN: ${w}`);
  }
  console.log(`\nPass: ${pass} / Warn: ${warn} / Fail: ${fail}`);
  if (fail > 0) {
    console.log('\n提示：本命令仅校验本地路径与 URL 格式，不会主动 fetch wiki 验证存在。');
    console.log('要校验 wiki 真的可访问，运行 lark-cli wiki spaces get_node 等命令。');
  }
  process.exit(fail > 0 ? 1 : 0);
}

function die(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      // Support --key=value (Unix standard) AND --key value
      const eqIdx = a.indexOf('=');
      if (eqIdx > 2) {
        out[a.slice(2, eqIdx)] = a.slice(eqIdx + 1);
        continue;
      }
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    } else if (a.startsWith('-') && a.length > 1 && !/^-?\d/.test(a)) {
      // Short flag (skip negative numbers)
      const eqIdx = a.indexOf('=');
      if (eqIdx > 1) {
        out[a.slice(1, eqIdx)] = a.slice(eqIdx + 1);
      } else {
        out[a.slice(1)] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help' || argv[0] === 'help') {
    process.stdout.write(help());
    return;
  }
  if (argv[0] === '-v' || argv[0] === '--version' || argv[0] === 'version') {
    cmdVersion();
    return;
  }

  const cmd = argv[0];
  const rest = argv.slice(1);
  const args = parseArgs(rest);

  switch (cmd) {
    case 'methodology':
      cmdMethodology();
      break;
    case 'docs':
      cmdDocs(args._[0]);
      break;
    case 'list':
      cmdList();
      break;
    case 'show':
      cmdShow(args._[0]);
      break;
    case 'init':
      cmdInit(args);
      break;
    case 'links': {
      const sub = rest[0];
      if (!sub || sub === 'help' || sub === '--help' || sub === '-h') {
        cmdLinksHelp();
      } else if (sub === 'init') {
        cmdLinksInit();
      } else if (sub === 'list') {
        cmdLinksList(parseArgs(rest.slice(1)));
      } else if (sub === 'show') {
        cmdLinksShow(rest[1]);
      } else if (sub === 'check') {
        cmdLinksCheck(parseArgs(rest.slice(1)));
      } else {
        console.error(`未知 links 子命令：${sub}\n`);
        cmdLinksHelp();
        process.exit(1);
      }
      break;
    }
    default:
      console.error(`未知命令：${cmd}\n`);
      process.stdout.write(help());
      process.exit(1);
  }
}

main();
