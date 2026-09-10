import { readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

import { beforeAll, describe, expect, it } from 'vitest';
import { initLearnCard } from '@learncard/init';
import { AlignmentValidator, LCNBoostStatus, UnsignedVCValidator } from '@learncard/types';

const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

let wallet: Awaited<ReturnType<typeof initLearnCard>>;
let subjectDid: string;

beforeAll(async () => {
    wallet = await initLearnCard({ seed: 'a'.repeat(64), didkit, allowRemoteContexts: true });
    const recipient = await initLearnCard({
        seed: 'b'.repeat(64),
        didkit,
        allowRemoteContexts: true,
    });
    subjectDid = recipient.id.did();
}, 30_000);

const docsRoot = new URL('../../../../docs/', import.meta.url);
const summary = readFileSync(new URL('SUMMARY.md', docsRoot), 'utf8');
const section = summary.match(/^## 🧠 Understand\s*$([\s\S]*?)^## 📖 Reference\s*$/m)?.[1];
if (!section) throw new Error('docs/SUMMARY.md: missing Understand / Reference boundaries');
const pages = [...new Set([...section.matchAll(/\(([^)]+\.md)\)/g)].map(match => match[1]!))];
if (!pages.length) throw new Error('docs/SUMMARY.md: Understand has no Markdown links');

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const entries = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value]);

// Ignore ellipses within ordinary strings (including URL paths), but not an exact "..." value.
const isIllustrative = (source: string): boolean =>
    source.includes('…') ||
    [...source.matchAll(/"(?:\\.|[^"\\])*"|(\.\.\.)/g)].some(
        match => match[0] === '"..."' || Boolean(match[1])
    );

/** Check fragment fields wherever they occur, including inside achievement subjects. */
const validateFragments = (value: unknown): void => {
    if (Array.isArray(value)) {
        value.forEach(validateFragments);
        return;
    }
    if (!isObject(value)) return;

    if ('credentialStatus' in value) {
        for (const entry of entries(value.credentialStatus)) {
            expect(entry).toEqual(
                expect.objectContaining({
                    type: 'BitstringStatusListEntry',
                    statusPurpose: expect.stringMatching(/^(revocation|suspension)$/),
                    statusListIndex: expect.any(String),
                    statusListCredential: expect.any(String),
                })
            );
        }
    }
    if ('alignment' in value) {
        expect(Array.isArray(value.alignment)).toBe(true);
        for (const entry of entries(value.alignment)) {
            AlignmentValidator.parse(entry);
            expect(entry).toEqual(
                expect.objectContaining({
                    type: expect.arrayContaining(['Alignment']),
                    targetName: expect.any(String),
                    targetUrl: expect.any(String),
                })
            );
        }
    }
    if (
        'status' in value &&
        !('credentialSubject' in value) &&
        !isObject(value.status) &&
        !Array.isArray(value.status)
    ) {
        LCNBoostStatus.parse(value.status);
    }
    Object.values(value).forEach(validateFragments);
};

describe('Understand documentation JSON', () => {
    for (const page of pages) {
        const markdown = readFileSync(fileURLToPath(new URL(page, docsRoot)), 'utf8');
        // Match complete fences first so json-looking text inside another fence is not tested.
        const fences = /^[ \t]{0,3}(`{3,}|~{3,})([^\r\n]*)\r?\n([\s\S]*?)^[ \t]{0,3}\1[ \t]*\r?$/gm;
        for (const match of markdown.matchAll(fences)) {
            if (match[2]!.trim() !== 'json') continue;
            const source = match[3]!;
            const line = markdown.slice(0, match.index).split('\n').length;
            const location = `${page}:${line}`;

            it(`${location} parses`, () => {
                expect(() => JSON.parse(source)).not.toThrow();
            });

            // Parsing failures belong to the named parse test, not suite collection.
            let parsed: unknown;
            try {
                parsed = JSON.parse(source);
            } catch {
                continue;
            }
            if (isIllustrative(source) || !isObject(parsed)) continue;
            // Subject-only examples are fragments; credential-level markers must not
            // silently become fragments when their context or type is malformed.
            const credential =
                '@context' in parsed ||
                ('credentialSubject' in parsed && ('type' in parsed || 'issuer' in parsed));

            if (credential) {
                it(`${location} validates and issues`, async () => {
                    const prepared = JSON.parse(
                        source.includes('{{')
                            ? source.replace(/\{\{[^{}]+\}\}/g, 'Example')
                            : source
                    );
                    expect(prepared['@context']).toEqual(expect.any(Array));
                    expect(prepared.type).toEqual(expect.arrayContaining(['VerifiableCredential']));
                    prepared.issuer = wallet.id.did();
                    for (const subject of entries(prepared.credentialSubject)) {
                        if (isObject(subject)) subject.id ??= subjectDid;
                    }
                    const dateField = prepared['@context'].includes(
                        'https://www.w3.org/ns/credentials/v2'
                    )
                        ? 'validFrom'
                        : 'issuanceDate';
                    prepared[dateField] ??= new Date().toISOString();
                    // Docs omit issuer/date intentionally: these are supplied during issuance.
                    const unsigned = UnsignedVCValidator.parse(prepared);
                    validateFragments(prepared);
                    const signed = await wallet.invoke.issueCredential(unsigned);
                    expect(signed.proof).toBeDefined();
                }, 15_000);
            } else {
                it(`${location} validates fragment fields`, () => validateFragments(parsed));
            }
        }
    }
});
