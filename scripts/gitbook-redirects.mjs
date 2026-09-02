#!/usr/bin/env node
/**
 * Verify and (if needed) enforce the docs redirect manifest against the published site.
 *
 * The manifest of record is docs/.gitbook.yaml (`redirects:`), which GitBook applies as
 * space-level redirects. This script exists because that behaviour cannot be observed in
 * PR previews from outside GitBook, and because site-level redirects (managed via the
 * GitBook API) are the documented fallback when space-level ones are insufficient.
 *
 * Modes:
 *
 *   node scripts/gitbook-redirects.mjs --verify [baseUrl]
 *       Request every redirect source under baseUrl (default https://docs.learncard.com)
 *       and report whether it 3xx's to the expected new URL, lands somewhere else, or 404s.
 *       Exit 1 if any source does not resolve. Run this right after merging to main.
 *
 *   node scripts/gitbook-redirects.mjs --apply [--dry-run]
 *       Upsert one site-level redirect per manifest entry via the GitBook API, with an
 *       external destination of <baseUrl>/<new-url>. Idempotent: existing rules with the
 *       same source and destination are left alone; differing destinations are updated.
 *       Requires env: GITBOOK_API_TOKEN, GITBOOK_ORG_ID, GITBOOK_SITE_ID.
 *       Only use this if --verify still reports failures after the space-level redirects
 *       have had time to publish.
 *
 * New URLs are computed with the same SUMMARY-derived URL model as check-docs-links.mjs
 * (see its header for why URLs are not file paths).
 */
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const CHECKER = join(ROOT, 'scripts', 'check-docs-links.mjs');
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const argAfter = name => {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
};

const BASE_URL = (
    argAfter('--verify') ||
    process.env.DOCS_BASE_URL ||
    'https://docs.learncard.com'
).replace(/\/$/, '');

// --- Load manifest and compute destination URLs ---------------------------------------

const yaml = readFileSync(join(DOCS, '.gitbook.yaml'), 'utf8');
const redirects = {};
let inRedirects = false;
for (const line of yaml.split('\n')) {
    if (/^redirects:\s*$/.test(line)) {
        inRedirects = true;
        continue;
    }
    if (!inRedirects) continue;
    const entry = line.match(/^\s+([^\s:#][^:]*):\s*(\S+)\s*$/);
    if (entry) redirects[entry[1].trim()] = entry[2].trim();
    else if (line.trim() && !line.trim().startsWith('#')) inRedirects = false;
}

const urlByFile = new Map(
    execFileSync('node', [CHECKER, '--urls'], { encoding: 'utf8' })
        .trim()
        .split('\n')
        .map(l => l.split('\t'))
        .map(([url, file]) => [file, url])
);

const plan = Object.entries(redirects).map(([source, destFile]) => {
    const destUrl = urlByFile.get(destFile);
    if (destUrl === undefined)
        throw new Error(`redirect destination is not a published page: ${destFile}`);
    return { source, destFile, destUrl, destAbs: `${BASE_URL}/${destUrl}`.replace(/\/$/, '') };
});

// --- --verify ----------------------------------------------------------------------------

const fetchStatus = async url => {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(25000) });
    return { status: res.status, location: res.headers.get('location') || '' };
};

const normalize = u => u.replace(/\/$/, '').split('#')[0].split('?')[0];

if (flag('--verify')) {
    console.log(`Verifying ${plan.length} redirects against ${BASE_URL} ...`);
    const results = [];
    const queue = [...plan];
    const worker = async () => {
        while (queue.length) {
            const item = queue.shift();
            try {
                const { status, location } = await fetchStatus(`${BASE_URL}/${item.source}`);
                const target = location.startsWith('/')
                    ? `${new URL(BASE_URL).origin}${location}`
                    : location;
                let verdict;
                if (status >= 300 && status < 400 && normalize(target) === normalize(item.destAbs))
                    verdict = 'OK';
                else if (status >= 300 && status < 400) verdict = 'WRONG_TARGET';
                else if (status === 200) verdict = 'LIVE_PAGE (redirect ignored)';
                else verdict = `HTTP_${status}`;
                results.push({ ...item, status, target, verdict });
            } catch (err) {
                results.push({ ...item, status: 0, target: '', verdict: `ERROR ${err.message}` });
            }
        }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    results.sort((a, b) => a.source.localeCompare(b.source));
    const bad = results.filter(r => r.verdict !== 'OK');
    for (const r of bad)
        console.log(
            `  ${r.verdict.padEnd(28)} ${r.source} -> ${r.target || '(none)'}  expected ${
                r.destUrl
            }`
        );
    console.log(`\n${results.length - bad.length}/${results.length} redirects resolve correctly.`);
    process.exit(bad.length ? 1 : 0);
}

// --- --apply -------------------------------------------------------------------------------

if (flag('--apply')) {
    const { GITBOOK_API_TOKEN, GITBOOK_ORG_ID, GITBOOK_SITE_ID } = process.env;
    if (!GITBOOK_API_TOKEN || !GITBOOK_ORG_ID || !GITBOOK_SITE_ID) {
        console.error('Set GITBOOK_API_TOKEN, GITBOOK_ORG_ID and GITBOOK_SITE_ID.');
        process.exit(2);
    }
    const dryRun = flag('--dry-run');
    const api = `https://api.gitbook.com/v1/orgs/${GITBOOK_ORG_ID}/sites/${GITBOOK_SITE_ID}/redirects`;
    const headers = {
        Authorization: `Bearer ${GITBOOK_API_TOKEN}`,
        'Content-Type': 'application/json',
    };
    const call = async (method, url, body) => {
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${await res.text()}`);
        return res.status === 204 ? null : res.json();
    };

    const existing = new Map();
    let page;
    do {
        const data = await call('GET', `${api}?limit=1000${page ? `&page=${page}` : ''}`);
        for (const item of data.items) existing.set(item.source, item);
        page = data.next?.page;
    } while (page);
    console.log(`${existing.size} site redirects already configured.`);

    let created = 0,
        updated = 0,
        unchanged = 0;
    for (const item of plan) {
        const source = `/${item.source}`;
        const destination = { kind: 'external', url: item.destAbs };
        const current = existing.get(source);
        if (
            current &&
            current.destination?.kind === 'external' &&
            normalize(current.destination.url) === normalize(item.destAbs)
        ) {
            unchanged++;
            continue;
        }
        if (current) {
            console.log(`${dryRun ? '[dry-run] ' : ''}UPDATE ${source} -> ${item.destAbs}`);
            if (!dryRun) await call('PATCH', `${api}/${current.id}`, { destination });
            updated++;
        } else {
            console.log(`${dryRun ? '[dry-run] ' : ''}CREATE ${source} -> ${item.destAbs}`);
            if (!dryRun) await call('POST', api, { source, destination, draft: false });
            created++;
        }
    }
    console.log(
        `\ncreated=${created} updated=${updated} unchanged=${unchanged}${
            dryRun ? ' (dry run — nothing written)' : ''
        }`
    );
    process.exit(0);
}

console.error('Usage: gitbook-redirects.mjs --verify [baseUrl] | --apply [--dry-run]');
process.exit(2);
