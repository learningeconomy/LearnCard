/**
 * try-verify.ts — smoke-test the OID4VP surface (Slices 6 + 7 + 7.5)
 * against a real verifier without needing a full wallet UI.
 *
 * What it does (in order):
 *   1. Parse the verifier's Authorization Request URI.
 *   2. For signed Request Objects (`request_uri` / `request`),
 *      fetch + **verify** the JWS per `client_id_scheme` (Slice 7.5).
 *      Supported schemes out of the box: `did` (did:jwk, did:web)
 *      and `x509_san_dns` (with --trusted-root or --unsafe-allow-self-signed).
 *   3. Resolve `presentation_definition_uri` if present.
 *   4. Load credentials from a JSON file.
 *   5. Run the PEX matcher + selector and print a preview of what the
 *      wallet would POST.
 *   6. With --submit, sign the VP and POST it to the verifier.
 *
 * Usage:
 *   pnpm try-verify <oid4vp-uri> --credentials <path.json> [options]
 */

/* eslint-disable no-console */

import { existsSync, readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

import type { JWKWithPrivateKey } from '@learncard/types';

import {
    resolveAuthorizationRequest,
} from '../src/vp/parse';
import { RequestObjectError } from '../src/vp/request-object';
import {
    selectCredentials,
    buildPresentationSubmission,
    inferCredentialFormat,
    CandidateCredential,
    SelectedDescriptor,
} from '../src/vp/select';
import type {
    AuthorizationRequest,
    PresentationDefinition,
} from '../src/vp/types';
import { VpError } from '../src/vp/types';
import { buildPresentation, ChosenCredential, VpFormat } from '../src/vp/present';
import { signPresentation } from '../src/vp/sign';
import { submitPresentation } from '../src/vp/submit';
import { createJoseEd25519Signer } from '../src/vci/proof';

interface CliArgs {
    requestUri: string;
    credentialsPath?: string;
    holderPath?: string;
    submit: boolean;
    envelopeFormat?: VpFormat;
    trustedRootPaths: string[];
    unsafeAllowSelfSigned: boolean;
    verbose: boolean;
}

interface HolderSidecar {
    did: string;
    kid: string;
    privateJwk: JWKWithPrivateKey;
    alg?: string;
}

/* ----------------------------------- cli ----------------------------------- */

const printUsage = (): void => {
    console.log(
        [
            '',
            'Usage:',
            '  pnpm try-verify <oid4vp-uri> --credentials <path.json> [options]',
            '',
            'Arguments:',
            '  <oid4vp-uri>          OpenID4VP Authorization Request URI (openid4vp://..., haip://..., https://...)',
            '',
            'Options:',
            '  --credentials <path>      JSON file containing a VC or an array of VCs.',
            '                            Each entry may be a W3C VC object or a compact JWT-VC string.',
            '  --submit                  After PEX selection, build + sign a VerifiablePresentation and',
            '                            POST it to the verifier\'s response_uri (direct_post, OID4VP §8).',
            '                            Requires a holder sidecar at <credentials-path>.holder.json',
            '                            (written automatically by `try-offer --save`) or an explicit',
            '                            --holder path.',
            '  --holder <path>           JSON file carrying the holder key used to sign the VP:',
            '                              { did, kid, privateJwk, alg? }',
            '                            Default: <credentials-path>.holder.json',
            '  --envelope <format>       Override the VP envelope format. One of: jwt_vp_json | ldp_vp.',
            '                            Default: inferred from verifier\'s pd.format + VC formats.',
            '  --trusted-root <path>     PEM file containing a trusted X.509 root certificate. Repeat',
            '                            to add multiple. Required for client_id_scheme=x509_san_dns',
            '                            unless --unsafe-allow-self-signed is set.',
            '  --unsafe-allow-self-signed',
            '                            Accept self-signed x509 chains for development. NEVER use in',
            '                            production — disables the chain-to-trust-root check.',
            '  --verbose, -v             Log the full resolved request + per-field match results',
            '  --help, -h                Show this message',
            '',
            'Examples:',
            '  # by_value request, walt.id-style',
            '  pnpm try-verify "openid4vp://?client_id=...&presentation_definition=..." \\',
            '                  --credentials ./vc.json --submit',
            '',
            '  # signed Request Object via did:web / did:jwk (verified automatically)',
            '  pnpm try-verify "openid4vp://?request_uri=https://verifier.example/req" \\',
            '                  --credentials ./vc.json',
            '',
            '  # signed Request Object via x509_san_dns with a pinned trust root',
            '  pnpm try-verify "openid4vp://?request_uri=https://eudi.example/req" \\',
            '                  --credentials ./vc.json --trusted-root ./eu-digital-id.pem',
            '',
        ].join('\n')
    );
};

const parseArgs = (argv: string[]): CliArgs => {
    const args = argv.slice(2);

    let requestUri: string | undefined;
    let credentialsPath: string | undefined;
    let holderPath: string | undefined;
    let submit = false;
    let envelopeFormat: VpFormat | undefined;
    const trustedRootPaths: string[] = [];
    let unsafeAllowSelfSigned = false;
    let verbose = false;

    for (let i = 0; i < args.length; i++) {
        const a = args[i];

        switch (a) {
            case '--credentials':
                credentialsPath = args[++i];
                break;
            case '--holder':
                holderPath = args[++i];
                break;
            case '--submit':
                submit = true;
                break;
            case '--envelope': {
                const value = args[++i];
                if (value !== 'jwt_vp_json' && value !== 'ldp_vp') {
                    console.error(`--envelope must be jwt_vp_json or ldp_vp (got ${value})`);
                    process.exit(2);
                }
                envelopeFormat = value;
                break;
            }
            case '--trusted-root':
                trustedRootPaths.push(args[++i]!);
                break;
            case '--unsafe-allow-self-signed':
                unsafeAllowSelfSigned = true;
                break;
            case '--unsafe-decode-jws':
                // Deprecated alias from pre-Slice-7.5. Preserved so
                // stale copy-paste invocations don't error out, but
                // the flag no longer does anything — signed Request
                // Objects are now verified properly by default.
                console.warn(
                    '⚠ --unsafe-decode-jws is deprecated. Signed Request Objects are now verified by default (Slice 7.5).'
                );
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
                if (requestUri) {
                    console.error('Multiple positional arguments — only one OID4VP URI is expected');
                    process.exit(2);
                }
                requestUri = a;
        }
    }

    if (!requestUri) {
        console.error('Missing OID4VP Authorization Request URI');
        printUsage();
        process.exit(2);
    }

    return {
        requestUri,
        credentialsPath,
        holderPath,
        submit,
        envelopeFormat,
        trustedRootPaths,
        unsafeAllowSelfSigned,
        verbose,
    };
};

/**
 * Load the holder sidecar file written by `try-offer --save`. Returns
 * `undefined` when the user didn't pass `--holder` AND no default
 * sibling exists — the caller surfaces a user-friendly error then.
 */
const loadHolder = (args: CliArgs): HolderSidecar | undefined => {
    const candidatePath =
        args.holderPath ??
        (args.credentialsPath ? `${args.credentialsPath}.holder.json` : undefined);

    if (!candidatePath) return undefined;

    const absolute = resolvePath(process.cwd(), candidatePath);
    if (!existsSync(absolute)) return undefined;

    const raw = readFileSync(absolute, 'utf8');
    let parsed: HolderSidecar;
    try {
        parsed = JSON.parse(raw) as HolderSidecar;
    } catch (e) {
        throw new Error(`Failed to parse holder sidecar at ${absolute}: ${describe(e)}`);
    }

    if (!parsed.did || !parsed.kid || !parsed.privateJwk) {
        throw new Error(
            `Holder sidecar at ${absolute} is missing did / kid / privateJwk — regenerate via \`try-offer --save\``
        );
    }

    return parsed;
};

/* --------------------------------- helpers -------------------------------- */

const loadCredentials = (path: string): CandidateCredential[] => {
    const absolute = resolvePath(process.cwd(), path);
    const raw = readFileSync(absolute, 'utf8');

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        throw new Error(`Failed to parse JSON in ${absolute}: ${describe(e)}`);
    }

    const list = Array.isArray(parsed) ? parsed : [parsed];

    return list.map((vc, i) => ({
        credential: vc,
        format: inferCredentialFormat(vc),
        id: `${path}#${i}`,
    }));
};

const pretty = (value: unknown): string => JSON.stringify(value, null, 2);

/**
 * Load every `--trusted-root` PEM into an in-memory array the plugin
 * passes to the Slice 7.5 verification layer.
 */
const loadTrustedRoots = (paths: string[]): string[] =>
    paths.map(p => {
        const absolute = resolvePath(process.cwd(), p);
        if (!existsSync(absolute)) {
            throw new Error(`Trusted root not found: ${absolute}`);
        }
        return readFileSync(absolute, 'utf8');
    });

const truncate = (value: string, max: number): string =>
    value.length <= max ? value : value.slice(0, max - 1) + '…';

const describe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/* ----------------------------------- main ---------------------------------- */

const main = async (): Promise<void> => {
    const args = parseArgs(process.argv);

    console.log('\n=== OID4VP Try-Verify Harness ===\n');
    console.log(`Request URI: ${truncate(args.requestUri, 120)}`);

    /* 1. Resolve the request. Signed Request Objects are verified here
     *    (Slice 7.5): did:jwk / did:web by default, x509_san_dns when
     *    --trusted-root is supplied or --unsafe-allow-self-signed is on.
     *
     * 2. presentation_definition_uri is also resolved transparently
     *    as part of this call.
     */
    const trustedX509Roots = loadTrustedRoots(args.trustedRootPaths);

    if (args.unsafeAllowSelfSigned) {
        console.log(
            '\n⚠ UNSAFE MODE — accepting self-signed x509 chains (client_id_scheme=x509_san_dns)'
        );
    }

    const request = await resolveAuthorizationRequest(args.requestUri, undefined, {
        trustedX509Roots,
        unsafeAllowSelfSigned: args.unsafeAllowSelfSigned,
    });

    /* 3. Print what we learned about the verifier's ask. */
    console.log('\n--- Verifier Authorization Request ---');
    console.log(`client_id:       ${request.client_id}`);
    if (request.client_id_scheme)
        console.log(`client_id_scheme: ${request.client_id_scheme}`);
    console.log(`response_type:   ${request.response_type}`);
    if (request.response_mode) console.log(`response_mode:   ${request.response_mode}`);
    console.log(`response_uri:    ${request.response_uri ?? request.redirect_uri ?? '(none)'}`);
    console.log(`nonce:           ${truncate(request.nonce, 60)}`);
    if (request.state) console.log(`state:           ${truncate(request.state, 60)}`);

    if (args.verbose) {
        console.log('\n[full request]');
        console.log(pretty(request));
    }

    const pd = request.presentation_definition;
    if (!pd) {
        console.log('\nNo presentation_definition resolved — nothing to match against.');
        console.log('(SIOPv2-only flows and scope-based PD lookups aren\'t covered by Slice 6.)');
        return;
    }

    console.log('\n--- Presentation Definition ---');
    console.log(`id:      ${pd.id}`);
    if (pd.name) console.log(`name:    ${pd.name}`);
    if (pd.purpose) console.log(`purpose: ${pd.purpose}`);
    console.log(`Input descriptors (${pd.input_descriptors.length}):`);
    for (const d of pd.input_descriptors) {
        const label = d.name ? `"${d.name}"` : '';
        const group = d.group ? ` [group=${d.group.join(',')}]` : '';
        console.log(`  - ${d.id} ${label}${group}`);
    }

    /* 4. Load candidate credentials. */
    if (!args.credentialsPath) {
        console.log(
            '\nNo --credentials <path> supplied — skipping PEX matching.\n' +
                'Re-run with `--credentials ./vc.json` to see which of your credentials would satisfy the request.'
        );
        return;
    }

    const candidates = loadCredentials(args.credentialsPath);
    console.log(`\n--- Candidate Credentials (${candidates.length}) ---`);
    for (const c of candidates) {
        console.log(`  - ${c.id}  format=${c.format ?? '(unknown)'}`);
    }

    /* 5. Run the matcher + selector. */
    const selection = selectCredentials(candidates, pd);

    console.log('\n--- Selection Result ---');
    console.log(`canSatisfy: ${selection.canSatisfy ? '✓ YES' : '✗ NO'}`);
    if (!selection.canSatisfy) {
        console.log(`reason:     ${selection.reason}`);
    }

    for (const descriptor of selection.descriptors) {
        const label = `"${descriptor.descriptorId}"`;

        if (descriptor.candidates.length === 0) {
            console.log(`\nDescriptor ${label}: 0 matches`);
            if (descriptor.reason) console.log(`  reason: ${descriptor.reason}`);
            continue;
        }

        console.log(`\nDescriptor ${label}: ${descriptor.candidates.length} match(es)`);
        for (const match of descriptor.candidates) {
            console.log(
                `  - [${match.candidateIndex}] id=${match.candidate.id}  format=${match.candidate.format ?? '(unknown)'}`
            );

            if (args.verbose) {
                for (const f of match.match.fields) {
                    const marker = f.matched ? '✓' : '✗';
                    const path = f.matchedPath ?? '(no path matched)';
                    console.log(`      ${marker} ${path}`);
                }
            }
        }
    }

    /* 6. Preview the Presentation Submission the wallet would send. */
    if (!selection.canSatisfy) {
        return;
    }

    const firstChoices: SelectedDescriptor[] = selection.descriptors.map((d, i) => {
        const candidate = d.candidates[0]!.candidate;
        return {
            descriptorId: d.descriptorId,
            format: candidate.format ?? 'ldp_vc',
            path: `$.verifiableCredential[${i}]`,
        };
    });

    const previewSubmission = buildPresentationSubmission(pd, firstChoices);

    console.log('\n--- Presentation Submission (first-match preview) ---');
    console.log(pretty(previewSubmission));

    const destination = request.response_uri ?? request.redirect_uri ?? '(no response target)';

    if (!args.submit) {
        console.log(
            [
                '',
                '✓ Preview only. Re-run with --submit to sign the VP and POST it to',
                `  ${destination}.`,
                '',
            ].join('\n')
        );
        return;
    }

    /* 7. --submit: sign the VP and POST to response_uri. */
    await runSubmit({
        args,
        request,
        pd,
        selection,
    });
};

const runSubmit = async (ctx: {
    args: CliArgs;
    request: AuthorizationRequest;
    pd: PresentationDefinition;
    selection: ReturnType<typeof selectCredentials>;
}): Promise<void> => {
    const { args, request, pd, selection } = ctx;

    const responseUri = request.response_uri ?? request.redirect_uri;
    if (!responseUri) {
        throw new Error(
            'Verifier Authorization Request has no response_uri / redirect_uri — cannot --submit'
        );
    }

    const holder = loadHolder(args);
    if (!holder) {
        throw new Error(
            [
                'No holder sidecar found.',
                '',
                '  try-verify --submit needs the holder key that issued the credential.',
                '  Either:',
                '    1. Re-run `try-offer --save <path>` (writes <path>.holder.json next to',
                '       your credential file, which this harness auto-discovers), or',
                '    2. Pass --holder <path.json> explicitly (shape:',
                '       { did, kid, privateJwk, alg }).',
            ].join('\n')
        );
    }

    /* Build the wallet’s picks: first match per descriptor. */
    const chosen: ChosenCredential[] = selection.descriptors.map(d => ({
        descriptorId: d.descriptorId,
        candidate: d.candidates[0]!.candidate,
    }));

    /* 7a. Build the unsigned VP + submission. */
    const prepared = buildPresentation({
        pd,
        chosen,
        holder: holder.did,
        envelopeFormat: args.envelopeFormat,
    });

    console.log(`\n--- Prepared VP (envelope=${prepared.vpFormat}) ---`);
    console.log(`holder:          ${holder.did}`);
    console.log(`verifiableCredential count: ${chosen.length}`);
    if (args.verbose) {
        console.log('\n[unsigned vp]');
        console.log(pretty(prepared.unsignedVp));
        console.log('\n[presentation_submission]');
        console.log(pretty(prepared.submission));
    }

    /* 7b. Sign. */
    if (prepared.vpFormat === 'ldp_vp') {
        throw new Error(
            [
                'The harness only signs jwt_vp_json envelopes (no didkit linked into this script).',
                '',
                '  Pass --envelope jwt_vp_json to force the JWT path, or extend the harness to',
                '  wire an ldp signer.',
            ].join('\n')
        );
    }

    const jwtSigner = await createJoseEd25519Signer({
        keypair: holder.privateJwk,
        kid: holder.kid,
    });

    const signed = await signPresentation(
        {
            unsignedVp: prepared.unsignedVp,
            vpFormat: prepared.vpFormat,
            audience: request.client_id,
            nonce: request.nonce,
            holder: holder.did,
        },
        { jwtSigner }
    );

    if (args.verbose && typeof signed.vpToken === 'string') {
        console.log('\n[signed vp_token]');
        console.log(signed.vpToken);
    }

    /* 7c. POST to response_uri. */
    console.log(`\n→ POST ${responseUri}`);
    try {
        const result = await submitPresentation({
            responseUri,
            vpToken: signed.vpToken,
            submission: prepared.submission,
            state: request.state,
        });

        console.log(`\n✓ Verifier accepted the VP (HTTP ${result.status}).`);
        if (result.redirectUri) {
            console.log(`  redirect_uri: ${result.redirectUri}`);
        }
        if (result.body !== undefined) {
            console.log('\n[verifier body]');
            console.log(typeof result.body === 'string' ? result.body : pretty(result.body));
        }
    } catch (e) {
        if (e && typeof e === 'object' && 'code' in e) {
            const err = e as {
                code: string;
                message?: string;
                status?: number;
                body?: unknown;
            };
            console.error(`\n✗ Verifier rejected the VP:\n`);
            if (err.code) console.error(`  code:    ${err.code}`);
            if (err.message) console.error(`  message: ${err.message}`);
            if (err.status !== undefined) console.error(`  status:  ${err.status}`);
            if (err.body !== undefined)
                console.error(
                    `  body:    ${typeof err.body === 'string' ? err.body : pretty(err.body)}`
                );
            process.exitCode = 1;
        } else {
            throw e;
        }
    }
};

main().catch(error => {
    console.error('\n✗ try-verify failed:\n');

    if (error instanceof RequestObjectError) {
        console.error(`  code:    ${error.code}`);
        console.error(`  message: ${error.message}`);
        console.error('');
        console.error('  Signed Request Object verification failed.');
        console.error('  If the verifier uses client_id_scheme=x509_san_dns, you may need:');
        console.error('    --trusted-root <path.pem>      (production path)');
        console.error('    --unsafe-allow-self-signed     (dev/staging only)');
    } else if (error instanceof VpError) {
        console.error(`  code:    ${error.code}`);
        console.error(`  message: ${error.message}`);
    } else if (error instanceof Error) {
        console.error(`  ${error.message}`);
        if (error.stack && process.env.DEBUG) console.error(error.stack);
    } else {
        console.error(error);
    }

    process.exit(1);
});
