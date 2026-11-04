import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * The plugin method blocks a seeded network wallet installs, as `[file, opening line]`.
 * Shared with the method-catalog test so `call --list`, `call --describe` and the test read
 * the same declarations.
 */
export const PLUGIN_METHOD_BLOCKS: readonly (readonly [string, string])[] = [
    [
        'packages/plugins/learn-card-network/src/types.ts',
        'export type LearnCardNetworkPluginMethods = {',
    ],
    ['packages/plugins/vc/src/types.ts', 'export type VCPluginMethods = {'],
    ['packages/plugins/didkit/src/types.ts', 'export type DidkitPluginMethods = {'],
    [
        'packages/plugins/didkey/src/types.ts',
        'export type DidKeyPluginMethods<DidMethod extends string> = {',
    ],
    ['packages/plugins/encryption/src/types.ts', 'export type EncryptionPluginMethods = {'],
    ['packages/plugins/learn-cloud/src/types.ts', 'export type LearnCloudPluginMethods = {'],
    ['packages/plugins/vc-templates/src/types.ts', 'export type VCTemplatePluginMethods = {'],
    ['packages/plugins/vpqr/src/types.ts', 'export type VpqrPluginMethods = {'],
    ['packages/plugins/ethereum/src/types.ts', 'export type EthereumPluginMethods = {'],
    ['packages/plugins/learn-card/src/types.ts', 'export type LearnCardPluginMethods = {'],
    ['packages/plugins/openid4vc/src/types.ts', 'export type OpenID4VCPluginMethods = {'],
    ['packages/plugins/chapi/src/types.ts', 'export type CHAPIPluginMethods = {'],
    [
        'packages/plugins/sd-jwt-vc/src/types.ts',
        'export type SdJwtVcPluginMethods = VerifyExtension & {',
    ],
    ['packages/plugins/crypto/src/types.ts', 'export type CryptoPluginMethods = {'],
];

export interface MethodSignature {
    /** Plugin package directory, e.g. `learn-card-network`. */
    plugin: string;
    /** The TypeScript member declaration, whitespace-collapsed, e.g. `getProfile: (profileId?: string) => Promise<...>`. */
    signature: string;
    /** The member's JSDoc, if any, as plain text. */
    doc?: string;
}

const MEMBER_START = /^ {4}([A-Za-z0-9_]+)\??[:(<]/;

const cleanDoc = (lines: string[]): string | undefined => {
    const text = lines
        .map(line =>
            line
                .trim()
                .replace(/^\/\*\*?/, '')
                .replace(/\*\/$/, '')
                .replace(/^\*\s?/, '')
                .trim()
        )
        .filter(Boolean)
        .join(' ');
    return text || undefined;
};

/** Parse one `{ ... }` method block into `name → signature` (first declaration wins). */
export const parseMethodBlock = (
    source: string,
    start: string,
    plugin: string
): Map<string, MethodSignature> => {
    const result = new Map<string, MethodSignature>();
    const from = source.indexOf(start);
    if (from < 0) return result;
    const end = source.indexOf('\n};', from);
    const lines = source.slice(from + start.length, end).split('\n');
    let doc: string[] = [];
    let inDoc = false;
    let current: { name: string; lines: string[]; doc?: string } | undefined;
    const flush = (): void => {
        if (!current || result.has(current.name)) return;
        const signature = current.lines
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/\s*;\s*$/, '')
            .replace(/([(<{[]) /g, '$1')
            .replace(/ ([)>}\]])/g, '$1')
            .replace(/;([)}])/g, '$1')
            .trim();
        result.set(current.name, {
            plugin,
            signature,
            ...(current.doc ? { doc: current.doc } : {}),
        });
    };
    for (const line of lines) {
        const trimmed = line.trim();
        if (/^ {4}\/\*\*/.test(line) || (!current && trimmed.startsWith('/**'))) {
            flush();
            current = undefined;
            doc = [line];
            inDoc = !trimmed.endsWith('*/');
            continue;
        }
        if (inDoc) {
            doc.push(line);
            if (trimmed.endsWith('*/')) inDoc = false;
            continue;
        }
        const member = MEMBER_START.exec(line);
        if (member) {
            flush();
            current = { name: member[1]!, lines: [trimmed], doc: cleanDoc(doc) };
            doc = [];
            continue;
        }
        if (/^ {4}\/\//.test(line)) continue; // line comments between members
        if (current && trimmed) current.lines.push(trimmed);
    }
    flush();
    return result;
};

/** Read every plugin block and return `name → signature` (earlier plugins win on clashes). */
export const readMethodSignatures = async (
    repoRoot: string
): Promise<Record<string, MethodSignature>> => {
    const all: Record<string, MethodSignature> = {};
    for (const [file, start] of PLUGIN_METHOD_BLOCKS) {
        const source = await readFile(resolve(repoRoot, file), 'utf8');
        const plugin = file.split('/')[2]!;
        for (const [name, signature] of parseMethodBlock(source, start, plugin))
            all[name] ??= signature;
    }
    return Object.fromEntries(Object.entries(all).sort(([a], [b]) => a.localeCompare(b)));
};

/** Module source for `src/generated/method-signatures.ts`. */
export const methodSignaturesModule = (signatures: Record<string, MethodSignature>): string =>
    '// Generated from packages/plugins/*/src/types.ts by scripts/method-signatures.ts. Do not edit.\n' +
    'export const METHOD_SIGNATURES: Record<string, { plugin: string; signature: string; doc?: string }> = ' +
    JSON.stringify(signatures, null, 1) +
    ';\n';
