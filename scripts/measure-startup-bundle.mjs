import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
const [workspace, build, output] = process.argv.slice(2);
const { init, parse } = await import(
    pathToFileURL(resolve(workspace, 'node_modules/es-module-lexer/dist/lexer.js'))
);
await init;
const root = resolve(build);
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const entry = [...html.matchAll(/<script\b(?=[^>]*type="module")[^>]*src="([^"]+)"/g)]
    .map(match => match[1])
    .find(src => src.startsWith('/assets/'));
if (!entry) throw new Error('Missing application module entry');
const assets = await readdir(resolve(root, 'assets'));
const find = prefix => {
    const matches = assets.filter(file => file.startsWith(prefix + '-') && file.endsWith('.js'));
    if (matches.length !== 1) throw new Error(`Expected one ${prefix} chunk; found ${matches}`);
    return resolve(root, 'assets', matches[0]);
};
const main = resolve(root, entry.replace(/^\//, ''));
const allRoots = [main, find('FullApp'), find('Routes'), find('AiPathways')];
const measure = async roots => {
    const seen = new Set();
    let rawBytes = 0;
    let gzipBytes = 0;
    const visit = async file => {
        if (seen.has(file)) return;
        seen.add(file);
        const bytes = await readFile(file);
        rawBytes += bytes.length;
        gzipBytes += gzipSync(bytes).length;
        const [imports] = parse(bytes.toString('utf8'));
        for (const item of imports)
            if (item.d === -1 && item.n?.startsWith('.')) {
                await visit(resolve(dirname(file), item.n));
            }
    };
    for (const entryPoint of roots) await visit(entryPoint);
    return {
        rawBytes,
        gzipBytes,
        files: [...seen].map(file => relative(root, file)).sort(),
        mermaidFiles: [...seen]
            .filter(file => /mermaid/i.test(file))
            .map(file => relative(root, file)),
    };
};
const result = {
    roots: allRoots.map(file => relative(root, file)),
    entry: await measure([main]),
    signedInPathways: await measure(allRoots),
    method: 'Built ESM static import closure, dynamic imports excluded; sum per-file gzip at Node default level; JS only, no WASM/CSS/HTML.',
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(
    JSON.stringify({
        roots: result.roots,
        entry: { raw: result.entry.rawBytes, gzip: result.entry.gzipBytes },
        pathways: {
            raw: result.signedInPathways.rawBytes,
            gzip: result.signedInPathways.gzipBytes,
            mermaid: result.signedInPathways.mermaidFiles,
        },
    })
);
