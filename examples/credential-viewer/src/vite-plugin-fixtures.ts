/**
 * Vite plugin that adds dev-server middleware for reading/writing
 * credential fixture files on disk.
 *
 * Only active during `vite dev` — production builds don't include this.
 */
import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, ViteDevServer } from 'vite';

// process.cwd() is the credential-viewer directory when running `pnpm dev`
const FIXTURES_ROOT = path.resolve(
    process.cwd(),
    '../../packages/credential-library/src/fixtures',
);

const INDEX_PATH = path.join(FIXTURES_ROOT, 'index.ts');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** List subdirectories inside the fixtures root. */
function listFolders(): string[] {
    return fs
        .readdirSync(FIXTURES_ROOT, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort();
}

/** Convert a fixture id like "boost/my-badge" to a camelCase export name. */
function idToExportName(fixtureId: string): string {
    return fixtureId
        .replace(/[^a-zA-Z0-9/\-_]/g, '')
        .split(/[/\-_]+/)
        .map((seg, i) =>
            i === 0
                ? seg.toLowerCase()
                : seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase(),
        )
        .join('');
}

/** Convert a fixture id like "boost/my-badge" to a filename stem "my-badge". */
function idToFilename(fixtureId: string): string {
    const parts = fixtureId.split('/');

    return parts[parts.length - 1];
}

/**
 * Generate the TypeScript source for a fixture file.
 */
function generateFixtureSource(
    exportName: string,
    metadata: Record<string, unknown>,
    credential: Record<string, unknown>,
): string {
    const lines: string[] = [];

    lines.push("import type { CredentialFixture } from '../../types';");
    lines.push('');
    lines.push(`export const ${exportName}: CredentialFixture = {`);
    lines.push(`    id: ${JSON.stringify(metadata.id)},`);
    lines.push(`    name: ${JSON.stringify(metadata.name)},`);
    lines.push(`    description:`);
    lines.push(`        ${JSON.stringify(metadata.description)},`);
    lines.push(`    spec: ${JSON.stringify(metadata.spec)},`);
    lines.push(`    profile: ${JSON.stringify(metadata.profile)},`);
    lines.push(`    features: ${JSON.stringify(metadata.features)},`);
    lines.push(`    source: ${JSON.stringify(metadata.source)},`);
    lines.push(`    signed: ${JSON.stringify(metadata.signed)},`);
    lines.push(`    validity: ${JSON.stringify(metadata.validity)},`);

    if (metadata.tags && (metadata.tags as string[]).length > 0) {
        lines.push(`    tags: ${JSON.stringify(metadata.tags)},`);
    }

    lines.push('');
    lines.push(`    credential: ${JSON.stringify(credential, null, 8).replace(/\n/g, '\n    ')},`);
    lines.push('};');
    lines.push('');

    return lines.join('\n');
}

/**
 * Append a new fixture import + entry to fixtures/index.ts.
 */
function updateIndex(
    folder: string,
    filename: string,
    exportName: string,
    comment?: string,
): void {
    let src = fs.readFileSync(INDEX_PATH, 'utf-8');

    const importLine = `import { ${exportName} } from './${folder}/${filename}';`;

    // Don't add if already present
    if (src.includes(importLine)) return;

    // Find the last import line and insert after it
    const importLines = src.split('\n');
    let lastImportIdx = -1;

    for (let i = 0; i < importLines.length; i++) {
        if (importLines[i].startsWith('import ')) {
            lastImportIdx = i;
        }
    }

    if (lastImportIdx >= 0) {
        const sectionComment = comment ? `\n// ${comment}` : '';

        importLines.splice(lastImportIdx + 1, 0, `${sectionComment}\n${importLine}`);
    }

    src = importLines.join('\n');

    // Add to ALL_FIXTURES array — insert before the closing ];
    const closingBracket = src.lastIndexOf('];');

    if (closingBracket >= 0) {
        src =
            src.slice(0, closingBracket) +
            `    ${exportName},\n` +
            src.slice(closingBracket);
    }

    // Add to the named re-exports — insert before the closing };
    const reExportClose = src.lastIndexOf('};');

    if (reExportClose >= 0) {
        src =
            src.slice(0, reExportClose) +
            `    ${exportName},\n` +
            src.slice(reExportClose);
    }

    fs.writeFileSync(INDEX_PATH, src, 'utf-8');
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export default function fixtureWriterPlugin(): Plugin {
    return {
        name: 'fixture-writer',
        configureServer(server: ViteDevServer) {
            server.middlewares.use('/api/fixture-folders', (_req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ folders: listFolders() }));
            });

            server.middlewares.use('/api/save-fixture', (req, res) => {
                if (req.method !== 'POST') {
                    res.statusCode = 405;
                    res.end(JSON.stringify({ error: 'POST only' }));

                    return;
                }

                let body = '';

                req.on('data', (chunk: Buffer) => { body += chunk.toString(); });

                req.on('end', () => {
                    try {
                        const { folder, metadata, credential } = JSON.parse(body) as {
                            folder: string;
                            metadata: Record<string, unknown>;
                            credential: Record<string, unknown>;
                        };

                        if (!folder || !metadata?.id) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: 'Missing folder or metadata.id' }));

                            return;
                        }

                        const folderPath = path.join(FIXTURES_ROOT, folder);

                        if (!fs.existsSync(folderPath)) {
                            fs.mkdirSync(folderPath, { recursive: true });
                        }

                        const exportName = idToExportName(metadata.id as string);
                        const filename = idToFilename(metadata.id as string);
                        const filePath = path.join(folderPath, `${filename}.ts`);

                        if (fs.existsSync(filePath)) {
                            res.statusCode = 409;
                            res.end(JSON.stringify({ error: `File already exists: ${folder}/${filename}.ts` }));

                            return;
                        }

                        const source = generateFixtureSource(exportName, metadata, credential);

                        fs.writeFileSync(filePath, source, 'utf-8');

                        updateIndex(folder, filename, exportName);

                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            ok: true,
                            path: `${folder}/${filename}.ts`,
                            exportName,
                        }));
                    } catch (err) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({
                            error: err instanceof Error ? err.message : String(err),
                        }));
                    }
                });
            });
        },
    };
}
