/**
 * try-offer.ts — drive an OID4VCI Credential Offer end-to-end against a
 * real issuer, using an ephemeral did:jwk keypair for proof-of-possession.
 *
 * This bypasses the full LearnCard plugin wiring (which would require a
 * wallet with `id` + `vc` + `didkit` + LearnCloud plugins) by calling the
 * underlying `acceptCredentialOffer` orchestrator directly and supplying
 * a self-contained signer.
 *
 * Usage:
 *   pnpm try-offer <offer-uri> [--tx-code <code>] [--client-id <id>] \
 *                              [--only <id1,id2>] [--verbose]
 *
 * Example:
 *   pnpm try-offer "openid-credential-offer://?credential_offer_uri=https://..."
 */

/* eslint-disable no-console */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';

import { exportJWK, generateKeyPair } from 'jose';
import type { JWKWithPrivateKey } from '@learncard/types';

import {
    parseCredentialOfferUri,
    resolveCredentialOfferByReference,
} from '../src/offer/parse';
import type { CredentialOffer } from '../src/offer/types';
import { acceptCredentialOffer } from '../src/vci/accept';
import { createJoseEd25519Signer } from '../src/vci/proof';
import { normalizeIssuedCredential } from '../src/vci/decode';

interface CliArgs {
    offerUri: string;
    txCode?: string;
    clientId?: string;
    configurationIds?: string[];
    savePath?: string;
    verbose: boolean;
}

const printUsage = (): void => {
    console.log(
        [
            '',
            'Usage:',
            '  pnpm try-offer <offer-uri> [--tx-code <code>] [--client-id <id>] [--only <id1,id2>]',
            '                              [--save <path>] [--verbose]',
            '',
            'Arguments:',
            '  <offer-uri>        Credential Offer URI (openid-credential-offer://... or https://...)',
            '',
            'Options:',
            '  --tx-code <code>   Transaction code (PIN) if the offer requires one',
            '  --client-id <id>   Client identifier to present to the authorization server',
            '  --only <ids>       Comma-separated subset of credential_configuration_ids to request',
            '  --save <path>      Write the issued credential(s) as a JSON file at <path>. Single VC is',
            '                     saved as an object; multiple VCs as an array. Feed it straight into',
            '                     `pnpm try-verify ... --credentials <path>`.',
            '  --verbose, -v      Log the full resolved offer and issuer metadata',
            '  --help, -h         Show this message',
            '',
            'Examples:',
            '  pnpm try-offer "openid-credential-offer://?credential_offer_uri=https://dev.issuer.eudiw.dev/credential_offer/..."',
            '  pnpm try-offer --tx-code 1234 "openid-credential-offer://..."',
            '  pnpm try-offer --save ./my-vc.json "openid-credential-offer://..."',
            '',
        ].join('\n')
    );
};

const parseArgs = (argv: string[]): CliArgs => {
    const args = argv.slice(2);

    let offerUri: string | undefined;
    let txCode: string | undefined;
    let clientId: string | undefined;
    let configurationIds: string[] | undefined;
    let savePath: string | undefined;
    let verbose = false;

    for (let i = 0; i < args.length; i++) {
        const a = args[i];

        switch (a) {
            case '--tx-code':
                txCode = args[++i];
                break;

            case '--client-id':
                clientId = args[++i];
                break;

            case '--only':
                configurationIds = (args[++i] ?? '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
                break;

            case '--save':
                savePath = args[++i];
                if (!savePath) {
                    console.error('--save requires a path argument');
                    process.exit(2);
                }
                break;

            case '--verbose':
            case '-v':
                verbose = true;
                break;

            case '--help':
            case '-h':
                printUsage();
                process.exit(0);
                break;

            default:
                if (a.startsWith('--')) {
                    console.error(`Unknown flag: ${a}`);
                    printUsage();
                    process.exit(2);
                }
                if (!offerUri) {
                    offerUri = a;
                } else {
                    console.error(`Unexpected positional argument: ${a}`);
                    printUsage();
                    process.exit(2);
                }
        }
    }

    if (!offerUri) {
        printUsage();
        process.exit(2);
    }

    return { offerUri: offerUri!, txCode, clientId, configurationIds, savePath, verbose };
};

/**
 * Generate an ephemeral Ed25519 keypair + a self-contained did:jwk
 * identifier for proof-of-possession.
 *
 * did:jwk is preferred for OID4VCI holder binding because the public key
 * is encoded into the DID itself — the issuer resolves it without any
 * external registry lookup, which makes it the universally-supported
 * choice for holder PoP keys.
 */
const generateDidJwkSigner = async () => {
    const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true });

    const privateJwk = await exportJWK(privateKey);
    const publicJwk = await exportJWK(publicKey);

    // Strip any non-essential JWK fields so the DID is stable + minimal.
    const publicJwkMinimal = { kty: publicJwk.kty, crv: publicJwk.crv, x: publicJwk.x };

    const didSuffix = Buffer.from(JSON.stringify(publicJwkMinimal), 'utf-8').toString('base64url');
    const did = `did:jwk:${didSuffix}`;
    const kid = `${did}#0`; // did:jwk convention: fragment `#0` references the single verification method.

    const signer = await createJoseEd25519Signer({
        keypair: privateJwk as JWKWithPrivateKey,
        kid,
    });

    return {
        did,
        kid,
        signer,
        publicJwk: publicJwkMinimal,
        privateJwk: privateJwk as JWKWithPrivateKey,
    };
};

const truncate = (s: string, n: number): string => (s.length <= n ? s : `${s.slice(0, n)}…`);

const pretty = (value: unknown): string => JSON.stringify(value, null, 2);

const main = async (): Promise<void> => {
    const args = parseArgs(process.argv);

    console.log('\n=== OID4VCI Try-Offer Harness ===\n');
    console.log(`Offer URI: ${truncate(args.offerUri, 120)}`);

    // 1. Parse the offer URI (may be by-value or by-reference).
    const parsed = parseCredentialOfferUri(args.offerUri);
    console.log(`Parse mode: ${parsed.kind}`);

    // 2. Resolve by-reference offers over HTTP. `resolveCredentialOfferByReference`
    //    returns a `ParsedCredentialOfferUri` union, but in practice it always
    //    resolves to the `by_value` branch — we re-narrow to keep TS happy.
    const offer: CredentialOffer = await (async () => {
        if (parsed.kind === 'by_value') return parsed.offer;

        const resolved = await resolveCredentialOfferByReference(parsed.uri, globalThis.fetch);

        if (resolved.kind !== 'by_value') {
            throw new Error('resolveCredentialOfferByReference did not yield a by-value offer');
        }

        return resolved.offer;
    })();

    console.log(`Issuer:     ${offer.credential_issuer}`);
    console.log(`Configs:    ${offer.credential_configuration_ids.join(', ')}`);

    const grantKeys = Object.keys(offer.grants ?? {});
    console.log(`Grants:     ${grantKeys.length ? grantKeys.join(', ') : '(none)'}`);

    if (args.verbose) {
        console.log('\n--- Full resolved offer ---');
        console.log(pretty(offer));
    }

    // 3. Ephemeral holder key.
    const { did, kid, signer, privateJwk } = await generateDidJwkSigner();
    console.log(`\nHolder DID: ${truncate(did, 120)}`);
    if (args.verbose) console.log(`Holder kid: ${kid}`);

    // 4. Drive the pre-authorized_code flow end-to-end.
    console.log('\nRunning pre-authorized_code flow against issuer…');
    const accepted = await acceptCredentialOffer({
        offer,
        signer,
        options: {
            txCode: args.txCode,
            clientId: args.clientId,
            configurationIds: args.configurationIds,
        },
        fetchImpl: globalThis.fetch,
    });

    console.log(`\n=== ${accepted.credentials.length} credential(s) issued ===`);

    // Collect successfully-normalized VCs for --save. We keep the W3C-VC
    // shape (not the raw issuer response) because try-verify consumes that
    // shape directly and inferCredentialFormat still classifies JWT-VCs
    // correctly via the preserved proof.jwt / proof.type === 'JwtProof2020'.
    const savableVcs: unknown[] = [];
    let skippedOnSave = 0;

    for (let i = 0; i < accepted.credentials.length; i++) {
        const entry = accepted.credentials[i];

        console.log(
            `\n--- [${i}] configuration=${entry.configuration_id} format=${entry.format} ---`
        );

        try {
            const { vc, jwt } = normalizeIssuedCredential(entry.credential, entry.format);
            console.log(pretty(vc));
            if (args.verbose && jwt) console.log(`\nRaw JWT:\n${jwt}`);
            savableVcs.push(vc);
        } catch (decodeErr) {
            console.error(
                `(decode failed: ${decodeErr instanceof Error ? decodeErr.message : String(decodeErr)})`
            );
            console.log('Raw credential payload:');
            console.log(pretty(entry.credential));
            skippedOnSave += 1;
        }
    }

    if (accepted.notification_id) {
        console.log(`\nIssuer notification_id: ${accepted.notification_id}`);
    }

    if (args.savePath) {
        if (savableVcs.length === 0) {
            console.error(
                `\n✗ --save: no credentials could be normalized; nothing written to ${args.savePath}`
            );
            process.exit(1);
        }

        const payload = savableVcs.length === 1 ? savableVcs[0] : savableVcs;
        const absolute = resolvePath(process.cwd(), args.savePath);

        try {
            mkdirSync(dirname(absolute), { recursive: true });
            writeFileSync(absolute, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        } catch (writeErr) {
            console.error(
                `\n✗ --save: failed to write ${absolute}: ${writeErr instanceof Error ? writeErr.message : String(writeErr)}`
            );
            process.exit(1);
        }

        const shape = savableVcs.length === 1 ? 'single VC object' : `array of ${savableVcs.length} VCs`;
        console.log(`\n💾 Saved ${shape} to ${absolute}`);

        if (skippedOnSave > 0) {
            console.error(
                `   (skipped ${skippedOnSave} credential(s) that failed to normalize — check the log above)`
            );
        }

        // Sidecar holder file: try-verify --submit reads this to sign
        // the VP with the same holder the VC was issued to. Without
        // this, real verifiers (walt.id, Animo, EUDI) reject the VP
        // with a holder-binding mismatch.
        const holderPath = `${absolute}.holder.json`;
        const holderPayload = {
            did,
            kid,
            privateJwk,
            alg: 'EdDSA' as const,
            // Trailing note so nobody commits this by accident. The
            // plugin's .gitignore also catches *.holder.json.
            _warning: 'PRIVATE KEY MATERIAL — do not commit. Gitignored by default.',
        };

        try {
            writeFileSync(holderPath, `${JSON.stringify(holderPayload, null, 2)}\n`, 'utf8');
            console.log(`🔑 Saved holder key to ${holderPath}`);
        } catch (holderErr) {
            console.error(
                `\n⚠  Failed to write holder sidecar to ${holderPath}: ${
                    holderErr instanceof Error ? holderErr.message : String(holderErr)
                }`
            );
            console.error('   try-verify --submit will not be able to sign without it.');
        }

        console.log(
            `\n   Next: pnpm try-verify "<oid4vp-uri>" --credentials ${args.savePath} --submit`
        );
    }

    console.log('\n✓ Done');
};

main().catch((e: unknown) => {
    console.error('\n✗ try-offer failed:\n');

    if (e && typeof e === 'object') {
        const err = e as {
            code?: string;
            message?: string;
            status?: number;
            body?: unknown;
            cause?: unknown;
            stack?: string;
        };

        if (err.code) console.error(`  code:        ${err.code}`);
        if (err.message) console.error(`  message:     ${err.message}`);
        if (err.status !== undefined) console.error(`  http status: ${err.status}`);
        if (err.body !== undefined) console.error(`  body:        ${pretty(err.body)}`);
        if (err.cause) {
            const c = err.cause as { message?: string };
            console.error(`  cause:       ${c?.message ?? String(err.cause)}`);
        }
        if (!err.code && err.stack) console.error(err.stack);
    } else {
        console.error(e);
    }

    process.exit(1);
});
