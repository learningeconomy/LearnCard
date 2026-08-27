#!/usr/bin/env node
/**
 * Docs integrity checker for the GitBook space synced from docs/.
 *
 * Checks:
 *   1. Every internal link in docs/**\/*.md resolves to an existing file.
 *   2. Every SUMMARY.md entry resolves to an existing file.
 *   3. Every redirect in .gitbook.yaml points at an existing destination file,
 *      and its source path does not shadow a live page (GitBook silently
 *      ignores redirects whose source still exists).
 *   4. No redirect chains (a redirect destination must not itself be redirected).
 *
 * Pre-existing broken links are grandfathered in scripts/docs-links-allowlist.json
 * (shrink-only: fixing links removes entries; new breakage fails CI).
 *
 * Usage: node scripts/check-docs-links.mjs [--update-allowlist]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DOCS = join(ROOT, 'docs');
const ALLOWLIST_PATH = join(ROOT, 'scripts', 'docs-links-allowlist.json');
const UPDATE_ALLOWLIST = process.argv.includes('--update-allowlist');

const walk = dir =>
    readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        if (name.startsWith('.git')) return [];
        return statSync(full).isDirectory() ? walk(full) : [full];
    });

const mdFiles = walk(DOCS).filter(f => f.endsWith('.md'));

const LINK_PATTERNS = [
    /\[[^\]]*\]\(([^)\s]+)\)/g,
    /\{%\s*content-ref\s+url="([^"]+)"/g,
    /href="([^"]+)"/g,
];

const isExternal = url =>
    /^(https?:|mailto:|tel:|#)/.test(url) || url.startsWith('data:');

const resolveTarget = (fromFile, url) => {
    const clean = url.split('#')[0].split('?')[0];
    if (!clean) return null;
    const decoded = decodeURIComponent(clean);
    const base = decoded.startsWith('/') ? DOCS : dirname(fromFile);
    return resolve(base, decoded.replace(/^\//, ''));
};

const targetExists = target => {
    if (existsSync(target)) return true;
    if (existsSync(`${target}.md`)) return true;
    if (existsSync(join(target, 'README.md'))) return true;
    return false;
};

const errors = [];

for (const file of mdFiles) {
    const content = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file).split(sep).join('/');
    for (const pattern of LINK_PATTERNS) {
        for (const match of content.matchAll(pattern)) {
            const url = match[1];
            if (isExternal(url) || url.startsWith('broken-reference')) continue;
            const target = resolveTarget(file, url);
            if (target && !targetExists(target)) {
                errors.push(`${rel}: broken link -> ${url}`);
            }
        }
    }
}

const gitbookYaml = readFileSync(join(ROOT, '.gitbook.yaml'), 'utf8');
const redirects = {};
let inRedirects = false;
for (const line of gitbookYaml.split('\n')) {
    if (/^redirects:\s*(\{\})?\s*$/.test(line)) {
        inRedirects = !line.includes('{}');
        continue;
    }
    if (inRedirects) {
        const entry = line.match(/^\s+([^\s:#][^:]*):\s*(\S+)\s*$/);
        if (entry) redirects[entry[1].trim()] = entry[2].trim();
        else if (line.trim() && !line.trim().startsWith('#')) inRedirects = false;
    }
}

const redirectDestinations = new Set(Object.values(redirects));
for (const [source, dest] of Object.entries(redirects)) {
    if (source.startsWith('/')) {
        errors.push(`.gitbook.yaml: redirect source has leading slash -> ${source}`);
    }
    if (!targetExists(resolve(DOCS, dest))) {
        errors.push(`.gitbook.yaml: redirect destination missing -> ${source}: ${dest}`);
    }
    const sourceAbs = resolve(DOCS, source);
    if (existsSync(`${sourceAbs}.md`) || existsSync(join(sourceAbs, 'README.md'))) {
        errors.push(
            `.gitbook.yaml: redirect source still exists as a live page (redirect will be ignored) -> ${source}`
        );
    }
    const destAsSource = dest.replace(/\.md$/, '').replace(/\/README$/, '');
    if (redirects[destAsSource]) {
        errors.push(`.gitbook.yaml: redirect chain detected -> ${source}: ${dest}`);
    }
}
void redirectDestinations;

const allowlist = existsSync(ALLOWLIST_PATH)
    ? new Set(JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')))
    : new Set();

const newErrors = errors.filter(e => !allowlist.has(e));
const fixed = [...allowlist].filter(a => !errors.includes(a));

if (UPDATE_ALLOWLIST) {
    const unique = [...new Set(errors)].sort();
    writeFileSync(ALLOWLIST_PATH, JSON.stringify(unique, null, 4) + '\n');
    console.log(`Allowlist updated: ${unique.length} grandfathered issues.`);
    process.exit(0);
}

if (fixed.length > 0) {
    console.log(`${fixed.length} allowlisted issue(s) now fixed — shrink the allowlist:`);
    fixed.forEach(f => console.log(`  FIXED: ${f}`));
}

if (newErrors.length > 0) {
    console.error(`\n${newErrors.length} new docs integrity error(s):`);
    newErrors.forEach(e => console.error(`  ERROR: ${e}`));
    process.exit(1);
}

console.log(
    `Docs integrity OK: ${mdFiles.length} files, ${Object.keys(redirects).length} redirects, ${allowlist.size} grandfathered issues.`
);
if (fixed.length > 0) process.exit(1);
