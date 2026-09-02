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
 *   5. Pages listed in SUMMARY.md must not link to unpublished pages. This is
 *      source-gated: links between unpublished/orphaned pages are allowed
 *      (e.g. within docs/archive/).
 *   6. Every historical URL in scripts/docs-migration-map.csv either still
 *      resolves to a live page or has an explicit redirect.
 *
 * URL model (important): GitBook does NOT derive page URLs from file paths. A
 * page's URL is built from the SUMMARY.md hierarchy:
 *
 *     <group-slug>/<ancestor-page-slug>/.../<page-slug>
 *
 * where the group slug comes from the `## Heading` (or an explicit
 * `<a id="...">` anchor on it), `slug(README.md)` is its directory name, and
 * `slug(x.md)` is `x`. Renaming a group or re-nesting a page therefore changes
 * its URL even though no file moved. This checker computes URLs the same way so
 * that redirect shadowing and coverage are judged against real URLs, not paths.
 * Pages generated from `builtin:openapi` blocks are not derivable here; their
 * historical URLs must be listed in the redirect manifest by hand.
 *
 * Pre-existing broken links are grandfathered in scripts/docs-links-allowlist.json
 * (shrink-only: fixing links removes entries; new breakage fails CI).
 *
 * Usage:
 *   node scripts/check-docs-links.mjs [--update-allowlist]
 *   node scripts/check-docs-links.mjs --urls [path/to/SUMMARY.md]
 *       Print `url<TAB>file` for every page in a SUMMARY (defaults to docs/SUMMARY.md).
 *       Useful for diffing against a sitemap or an older SUMMARY (`git show main:docs/SUMMARY.md`).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const ALLOWLIST_PATH = join(ROOT, 'scripts', 'docs-links-allowlist.json');
const MIGRATION_MAP_PATH = join(ROOT, 'scripts', 'docs-migration-map.csv');
const UPDATE_ALLOWLIST = process.argv.includes('--update-allowlist');
const URLS_FLAG = process.argv.indexOf('--urls');

/** GitBook-style slug: lowercase, `&` -> `and`, everything non-alphanumeric -> `-`. */
const slugify = text =>
    text
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const pageSlug = file => {
    const base = file.replace(/\.md$/, '');
    return base.endsWith('/README')
        ? base.slice(0, -'/README'.length).split('/').pop()
        : base.split('/').pop();
};

/**
 * Parse a SUMMARY.md into [{ url, file }] using GitBook's hierarchy-based URL model.
 * Entries are relative to the docs root (`root` in .gitbook.yaml). The root README
 * has url '' and is included. External links, anchored duplicates and embedded
 * blocks (e.g. builtin:openapi yaml) are skipped.
 */
const summaryUrls = content => {
    const pages = [];
    let group = null;
    const stack = []; // [{ depth, slug }]
    for (const raw of content.split('\n')) {
        const heading = raw.match(/^##\s+(.*)$/);
        if (heading) {
            const anchor = heading[1].match(/<a[^>]*\bid="([^"]+)"/);
            const title = heading[1].replace(/<a[^>]*>.*?<\/a>/g, '').trim();
            group = anchor ? anchor[1] : slugify(title);
            stack.length = 0;
            continue;
        }
        const item = raw.match(/^(\s*)[-*+]\s+\[[^\]]*\]\(([^)\s]+)\)/);
        if (!item) continue;
        const [, indent, href] = item;
        if (/^https?:/.test(href) || href.includes('#') || !href.endsWith('.md')) continue;
        const depth = Math.floor(indent.replace(/\t/g, '    ').length / 4);
        while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
        const file = href.replace(/^\.\//, '');
        const slug = pageSlug(file);
        const url =
            file === 'README.md'
                ? ''
                : [group, ...stack.map(s => s.slug), slug].filter(Boolean).join('/');
        pages.push({ url, file });
        stack.push({ depth, slug });
    }
    return pages;
};

if (URLS_FLAG !== -1) {
    const target =
        process.argv[URLS_FLAG + 1] && !process.argv[URLS_FLAG + 1].startsWith('--')
            ? resolve(process.argv[URLS_FLAG + 1])
            : join(DOCS, 'SUMMARY.md');
    for (const { url, file } of summaryUrls(readFileSync(target, 'utf8')))
        console.log(`${url}\t${file}`);
    process.exit(0);
}

const SKIP_DIRS = new Set(['.git', '.gitbook']);

const walk = dir =>
    readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        if (SKIP_DIRS.has(name)) return [];
        return statSync(full).isDirectory() ? walk(full) : [full];
    });

const mdFiles = walk(DOCS).filter(f => f.endsWith('.md'));

const LINK_PATTERNS = [
    /\[[^\]]*\]\(([^)\s]+)\)/g,
    /\{%\s*content-ref\s+url="([^"]+)"/g,
    /href="([^"]+)"/g,
];

const isExternal = url => /^(https?:|mailto:|tel:|#)/.test(url) || url.startsWith('data:');

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

const FENCE_OPEN = /^[ \t]*(?:[-*+]\s+)?(`{3,})/;

const stripCode = content => {
    const kept = [];
    let fenceLength = null;
    for (const line of content.split('\n')) {
        const fence = line.match(FENCE_OPEN);
        if (fenceLength === null) {
            if (fence) fenceLength = fence[1].length;
            else kept.push(line);
        } else if (fence && fence[1].length >= fenceLength) {
            fenceLength = null;
        }
    }
    return kept.join('\n').replace(/`[^`\n]*`/g, '');
};

const canonicalPage = target => {
    if (existsSync(`${target}.md`)) return `${target}.md`;
    if (existsSync(join(target, 'README.md'))) return join(target, 'README.md');
    return existsSync(target) ? target : null;
};

const summaryContent = readFileSync(join(DOCS, 'SUMMARY.md'), 'utf8');
const publishedPages = new Set([join(DOCS, 'README.md'), join(DOCS, 'SUMMARY.md')]);
for (const match of summaryContent.matchAll(/\]\(([^)#\s]+\.md)/g)) {
    if (!match[1].startsWith('http')) publishedPages.add(resolve(DOCS, match[1]));
}

const errors = [];

for (const file of mdFiles) {
    const content = stripCode(readFileSync(file, 'utf8'));
    const rel = relative(ROOT, file).split(sep).join('/');
    for (const pattern of LINK_PATTERNS) {
        for (const match of content.matchAll(pattern)) {
            const url = match[1];
            if (isExternal(url) || url.startsWith('broken-reference')) continue;
            const target = resolveTarget(file, url);
            if (!target) continue;
            const page = canonicalPage(target);
            if (!page) {
                errors.push(`${rel}: broken link -> ${url}`);
            } else if (
                page.endsWith('.md') &&
                publishedPages.has(file) &&
                !publishedPages.has(page)
            ) {
                errors.push(`${rel}: links to unpublished page -> ${url}`);
            }
        }
    }
}

const GITBOOK_YAML = join(ROOT, '.gitbook.yaml');
if (!existsSync(GITBOOK_YAML)) {
    console.error(
        'Missing .gitbook.yaml at repo root — did it move? check-docs-links.mjs expects it there.'
    );
    process.exit(1);
}
const gitbookYaml = readFileSync(GITBOOK_YAML, 'utf8');
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

// Live URLs as GitBook will publish them (see URL model in the header docblock).
const currentPages = summaryUrls(summaryContent);
const currentUrls = new Set(currentPages.map(p => p.url));
const urlByFile = new Map(currentPages.map(p => [p.file, p.url]));

for (const [source, dest] of Object.entries(redirects)) {
    if (source.startsWith('/')) {
        errors.push(`.gitbook.yaml: redirect source has leading slash -> ${source}`);
    }
    if (!targetExists(resolve(DOCS, dest))) {
        errors.push(`.gitbook.yaml: redirect destination missing -> ${source}: ${dest}`);
    } else if (!urlByFile.has(dest)) {
        errors.push(
            `.gitbook.yaml: redirect destination is not a published page (must be a SUMMARY entry, e.g. dir/README.md) -> ${source}: ${dest}`
        );
    }
    if (currentUrls.has(source)) {
        errors.push(
            `.gitbook.yaml: redirect source is still a live URL (redirect will be ignored) -> ${source}`
        );
    }
    // A chain exists if the destination page's *current URL* is itself a redirect source.
    const destUrl = urlByFile.get(dest);
    if (destUrl !== undefined && redirects[destUrl]) {
        errors.push(
            `.gitbook.yaml: redirect chain detected -> ${source}: ${dest} (${destUrl} is also redirected)`
        );
    }
}

// Coverage: every historical URL must still be live or be redirected.
if (existsSync(MIGRATION_MAP_PATH)) {
    const rows = readFileSync(MIGRATION_MAP_PATH, 'utf8').trim().split('\n').slice(1);
    for (const row of rows) {
        const [oldUrl, newUrl] = row.split(',').map(s => s.trim());
        if (!oldUrl || oldUrl === '.') continue;
        const live = currentUrls.has(oldUrl);
        const redirected = Object.prototype.hasOwnProperty.call(redirects, oldUrl);
        if (!live && !redirected) {
            errors.push(
                `docs-migration-map.csv: historical URL is neither live nor redirected -> ${oldUrl}`
            );
        }
        if (newUrl && redirected && urlByFile.get(redirects[oldUrl]) !== newUrl) {
            errors.push(
                `docs-migration-map.csv: new_url disagrees with redirect destination -> ${oldUrl}: csv=${newUrl} redirect=${urlByFile.get(
                    redirects[oldUrl]
                )}`
            );
        }
        if (newUrl && live && newUrl !== oldUrl) {
            errors.push(
                `docs-migration-map.csv: URL is still live but new_url differs -> ${oldUrl}: csv=${newUrl}`
            );
        }
    }
}

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

if (fixed.length > 0) process.exit(1);

console.log(
    `Docs integrity OK: ${mdFiles.length} files, ${Object.keys(redirects).length} redirects, ${
        allowlist.size
    } grandfathered issues.`
);
