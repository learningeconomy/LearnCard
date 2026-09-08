/**
 * Benchmarks DIDKit signing/verification time for CLR credentials and isolates what
 * drives it.
 *
 * For each input CLR, the script re-issues several structural variants with a local
 * key and times two operations that the LearnCard app performs on a credential:
 *
 *   verify   `wallet.invoke.verifyCredential(vc)` - runs when a credential is opened
 *   share VP `wallet.invoke.issuePresentation(vp)` where the VP embeds the credential -
 *            runs when a share link is generated. Inside a VP the credential becomes a
 *            blank-node named graph, so blank nodes that canonicalize cheaply on their
 *            own can make URDNA2015 explode here (seconds -> minutes on real CLRs).
 *
 * Variants:
 *
 *   as-is         the credential exactly as provided (minus the original proof)
 *   ids-safe      every object without an `id` gets a deterministic `urn:uuid:` id, but
 *                 only where the CLR/OBv3 JSON schema permits `id` (alignment, criteria,
 *                 result, ...). This is what an issuer can realistically ship.
 *   ids-added     (opt-in) `id` on every blank node, including `association` and
 *                 `identifier`. Fails 1EdTech schema validation; kept as the theoretical
 *                 lower bound for canonicalization cost.
 *   no-nested     `credentialSubject.verifiableCredential` removed. Isolates the cost of
 *                 the spec-mandated duplication (achievements appear once at the subject
 *                 level and again inside each nested VC).
 *   no-schema     `credentialSchema` removed. DIDKit fetches each schema over the network
 *                 on every verify, so this isolates pure crypto + canonicalization time.
 *
 * `validFrom` is normalized to "now", `credentialStatus` is dropped (status lists are a
 * separate network cost), and the original proof is replaced by a local signature so
 * every variant verifies cleanly (`ok = yes`); anything else is reported.
 *
 * Usage (from repo root, after `bun run build` for the SDK packages):
 *
 *   bun --conditions=development packages/credential-library/scripts/bench-clr-verification.ts \
 *       [--runs 5] [--didkit wasm|node] [--no-vp] \
 *       [--variants as-is,ids-safe,no-nested,no-schema,ids-added] [file.json ...]
 *
 * With no files, every CLR fixture in the credential library is benchmarked. `--no-vp`
 * skips the share-VP measurement (it can take minutes on un-fixed real-world CLRs).
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';

import { initLearnCard } from '@learncard/init';

import type { UnsignedVC, VC } from '@learncard/types';

import { getFixtures, prepareFixture, isCredentialFixture } from '../src/index';

type Json = Record<string, unknown>;
type VariantName = 'as-is' | 'ids-added' | 'ids-safe' | 'no-nested' | 'no-schema';

const DEFAULT_VARIANTS: VariantName[] = ['as-is', 'ids-safe', 'no-nested', 'no-schema'];

const SCHEMA_FORBIDS_ID = new Set(['association', 'identifier']);

const SHARE_VP_CONTEXT = [
    'https://www.w3.org/ns/credentials/v2',
    'https://ctx.learncard.com/boosts/1.0.1.json',
];

const parseArgs = (argv: string[]) => {
    const files: string[] = [];
    let runs = 5;
    let didkit: 'wasm' | 'node' = 'wasm';
    let variants = DEFAULT_VARIANTS;
    let measureVp = true;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--runs') runs = Number(argv[++i]);
        else if (arg === '--didkit') didkit = argv[++i] as 'wasm' | 'node';
        else if (arg === '--variants') variants = argv[++i].split(',') as VariantName[];
        else if (arg === '--no-vp') measureVp = false;
        else if (arg.startsWith('--')) throw new Error(`Unknown flag ${arg}`);
        else files.push(arg);
    }

    return { files, runs, didkit, variants, measureVp };
};

const isPlainObject = (value: unknown): value is Json =>
    !!value && typeof value === 'object' && !Array.isArray(value);

const hasId = (obj: Json) => typeof obj.id === 'string' || typeof obj['@id'] === 'string';

const graphStats = (credential: Json) => {
    let blankNodes = 0;
    const shapes = new Map<string, number>();
    let contextEntries = 0;

    const walk = (value: unknown, key: string): void => {
        if (Array.isArray(value)) {
            value.forEach(item => walk(item, key));
            return;
        }
        if (!isPlainObject(value)) return;

        if (key === '@context') {
            contextEntries += 1;
            return;
        }

        if (key !== '' && key !== 'proof' && !hasId(value)) {
            blankNodes += 1;
            const shape = JSON.stringify(value, Object.keys(value).sort());
            shapes.set(shape, (shapes.get(shape) ?? 0) + 1);
        }

        Object.entries(value).forEach(([k, v]) => walk(v, k));
    };

    walk(credential, '');

    const duplicateBlankNodes = [...shapes.values()]
        .filter(count => count > 1)
        .reduce((sum, count) => sum + count, 0);

    const subject = isPlainObject(credential.credentialSubject) ? credential.credentialSubject : {};
    const nested = subject.verifiableCredential;

    return {
        bytes: Buffer.byteLength(JSON.stringify(credential)),
        blankNodes,
        duplicateBlankNodes,
        nestedVcs: Array.isArray(nested) ? nested.length : 0,
    };
};

const deterministicUrn = (obj: Json): string => {
    const digest = createHash('sha256')
        .update(JSON.stringify(obj, Object.keys(obj).sort()))
        .digest('hex');

    return `urn:uuid:${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
};

const addIdsToBlankNodes = (credential: Json, skipKeys: Set<string> = new Set()): Json => {
    const visit = (value: unknown, key: string): unknown => {
        if (Array.isArray(value)) return value.map(item => visit(item, key));
        if (!isPlainObject(value) || key === '@context' || key === 'proof') return value;

        const withChildren = Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, visit(v, k)])
        );

        if (key === '' || hasId(withChildren) || skipKeys.has(key)) return withChildren;

        return { id: deterministicUrn(withChildren), ...withChildren };
    };

    return visit(credential, '') as Json;
};

const removeNestedVcs = (credential: Json): Json => {
    const clone = structuredClone(credential);
    if (isPlainObject(clone.credentialSubject)) {
        delete clone.credentialSubject.verifiableCredential;
    }
    return clone;
};

const removeSchema = (credential: Json): Json => {
    const clone = structuredClone(credential);
    delete clone.credentialSchema;
    return clone;
};

const prepareForLocalIssuance = (credential: Json, issuerDid: string): UnsignedVC => {
    const clone = structuredClone(credential);
    delete clone.proof;
    delete clone.credentialStatus;

    if (isPlainObject(clone.issuer)) clone.issuer = { ...clone.issuer, id: issuerDid };
    else clone.issuer = issuerDid;

    const now = new Date().toISOString();
    if ('validFrom' in clone) clone.validFrom = now;
    if ('issuanceDate' in clone) clone.issuanceDate = now;

    return clone as UnsignedVC;
};

const buildVariant = (name: VariantName, credential: Json): Json => {
    switch (name) {
        case 'as-is':
            return credential;
        case 'ids-added':
            return addIdsToBlankNodes(credential);
        case 'ids-safe':
            return addIdsToBlankNodes(credential, SCHEMA_FORBIDS_ID);
        case 'no-nested':
            return removeNestedVcs(credential);
        case 'no-schema':
            return removeSchema(credential);
    }
};

const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const timeAsync = async <T>(fn: () => Promise<T>): Promise<{ ms: number; result: T }> => {
    const start = performance.now();
    const result = await fn();
    return { ms: performance.now() - start, result };
};

const loadInputs = async (files: string[]): Promise<{ name: string; credential: Json }[]> => {
    if (files.length > 0) {
        return Promise.all(
            files.map(async file => ({
                name: basename(file),
                credential: JSON.parse(await readFile(file, 'utf8')) as Json,
            }))
        );
    }

    return getFixtures({ spec: 'clr-v2' })
        .filter(isCredentialFixture)
        .filter(fixture => fixture.validity === 'valid')
        .map(fixture => ({
            name: fixture.id,
            credential: prepareFixture(fixture, {
                issuerDid: 'did:example:placeholder',
                freshIds: false,
            }) as Json,
        }));
};

const initWallet = async (didkit: 'wasm' | 'node') => {
    if (didkit === 'node') {
        return initLearnCard({ seed: 'a'.repeat(64), didkit: 'node', allowRemoteContexts: true });
    }

    const require = createRequire(import.meta.url);
    const wasm = await readFile(
        require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
    );

    return initLearnCard({ seed: 'a'.repeat(64), didkit: wasm, allowRemoteContexts: true });
};

const pad = (value: string | number, width: number, right = false) => {
    const text = String(value);
    return right ? text.padStart(width) : text.padEnd(width);
};

const main = async () => {
    const { files, runs, didkit, variants, measureVp } = parseArgs(process.argv.slice(2));
    const inputs = await loadInputs(files);

    console.log(
        `didkit=${didkit} runs=${runs} variants=${variants.join(',')} shareVp=${measureVp}\n`
    );

    const wallet = await initWallet(didkit);
    const issuerDid = wallet.id.did();

    const header = [
        pad('credential', 34),
        pad('variant', 10),
        pad('bytes', 8, true),
        pad('blank', 6, true),
        pad('dupBlank', 9, true),
        pad('nested', 7, true),
        pad('issue ms', 9, true),
        pad('verify ms (median)', 19, true),
        pad('min', 8, true),
        pad('max', 8, true),
        pad('ok', 4, true),
        pad('share VP ms', 12, true),
    ].join('  ');

    console.log(header);
    console.log('-'.repeat(header.length));

    for (const input of inputs) {
        for (const variantName of variants) {
            const variant = buildVariant(variantName, input.credential);
            const stats = graphStats(variant);
            const unsigned = prepareForLocalIssuance(variant, issuerDid);

            let signed: VC;
            let issueMs: number;
            try {
                ({ ms: issueMs, result: signed } = await timeAsync(() =>
                    wallet.invoke.issueCredential(unsigned)
                ));
            } catch (error) {
                console.log(
                    `${pad(input.name, 34)}  ${pad(variantName, 10)}  issue failed: ${
                        (error as Error).message
                    }`
                );
                continue;
            }

            const timings: number[] = [];
            const errors = new Set<string>();

            for (let run = 0; run < runs; run += 1) {
                const { ms, result } = await timeAsync(() =>
                    wallet.invoke.verifyCredential(signed)
                );
                timings.push(ms);
                result.errors.forEach((error: string) => errors.add(error));
            }

            const ok = errors.size === 0;

            let shareVpMs = 'skipped';
            if (measureVp) {
                const vp = {
                    '@context': SHARE_VP_CONTEXT,
                    type: ['VerifiablePresentation'],
                    holder: issuerDid,
                    verifiableCredential: [signed],
                };
                try {
                    const { ms } = await timeAsync(() => wallet.invoke.issuePresentation(vp));
                    shareVpMs = ms.toFixed(0);
                } catch (error) {
                    shareVpMs = `failed: ${(error as Error).message.slice(0, 40)}`;
                }
            }

            console.log(
                [
                    pad(input.name.slice(0, 34), 34),
                    pad(variantName, 10),
                    pad(stats.bytes, 8, true),
                    pad(stats.blankNodes, 6, true),
                    pad(stats.duplicateBlankNodes, 9, true),
                    pad(stats.nestedVcs, 7, true),
                    pad(issueMs.toFixed(0), 9, true),
                    pad(median(timings).toFixed(0), 19, true),
                    pad(Math.min(...timings).toFixed(0), 8, true),
                    pad(Math.max(...timings).toFixed(0), 8, true),
                    pad(ok ? 'yes' : 'NO', 4, true),
                    pad(shareVpMs, 12, true),
                ].join('  ')
            );

            if (!ok) console.log(`${' '.repeat(48)}errors: ${[...errors].join('; ')}`);
        }
        console.log('');
    }
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});
