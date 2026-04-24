/**
 * try-verify.ts — smoke-test the Slice 6 OID4VP surface against a real
 * verifier without needing a full wallet UI.
 *
 * What it does (in order):
 *   1. Parse the verifier's Authorization Request URI.
 *   2. For signed Request Objects (`request_uri` / `request`), fetch +
 *      decode the JWS *without verifying* — gated behind the explicit
 *      `--unsafe-decode-jws` flag. Slice 7 replaces this shortcut with
 *      proper signature verification via `client_id_scheme`.
 *   3. Resolve `presentation_definition_uri` if present.
 *   4. Load credentials from a JSON file.
 *   5. Run the PEX matcher + selector and print a preview of what the
 *      wallet would POST.
 *
 * This harness DOES NOT sign, submit, or touch any private keys. It
 * stops exactly where Slice 7 picks up.
 *
 * Usage:
 *   pnpm try-verify <oid4vp-uri> --credentials <path.json> [options]
 */

/* eslint-disable no-console */

import { existsSync, readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

import { decodeJwt, decodeProtectedHeader } from 'jose';
import type { JWKWithPrivateKey } from '@learncard/types';

import {
    parseAuthorizationRequestUri,
    resolvePresentationDefinitionByReference,
} from '../src/vp/parse';
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
    unsafeDecodeJws: boolean;
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
            '  --credentials <path>   JSON file containing a VC or an array of VCs.',
            '                         Each entry may be a W3C VC object or a compact JWT-VC string.',
            '  --submit               After PEX selection, build + sign a VerifiablePresentation and',
            '                         POST it to the verifier\'s response_uri (direct_post, OID4VP §8).',
            '                         Requires a holder sidecar at <credentials-path>.holder.json',
            '                         (written automatically by `try-offer --save`) or an explicit',
            '                         --holder path.',
            '  --holder <path>        JSON file carrying the holder key used to sign the VP:',
            '                           { did, kid, privateJwk, alg? }',
            '                         Default: <credentials-path>.holder.json',
            '  --envelope <format>    Override the VP envelope format. One of: jwt_vp_json | ldp_vp.',
            '                         Default: inferred from verifier\'s pd.format + VC formats.',
            '  --unsafe-decode-jws    Decode (without verifying) signed Request Objects so the harness',
            '                         can test Slice 6 against verifiers that use request_uri / request',
            '                         JWS (most real deployments). NEVER use for production — Slice 7',
            '                         adds proper signature verification via client_id_scheme.',
            '  --verbose, -v          Log the full resolved request + per-field match results',
            '  --help, -h             Show this message',
            '',
            'Examples:',
            '  pnpm try-verify "openid4vp://?client_id=...&presentation_definition=..." --credentials ./vc.json',
            '  pnpm try-verify "openid4vp://?request_uri=https://verifier.example.com/req" \\',
            '                  --credentials ./vc.json --unsafe-decode-jws',
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
    let unsafeDecodeJws = false;
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
            case '--unsafe-decode-jws':
                unsafeDecodeJws = true;
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
        unsafeDecodeJws,
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

/**
 * Fetch `request_uri` or decode the inline `request` JWS without
 * verifying the signature. Returns an {@link AuthorizationRequest} built
 * from the JWS payload claims. Gated behind `--unsafe-decode-jws` in the
 * harness; the plugin's public API still refuses this path until Slice 7.
 */
const decodeUnverifiedRequestObject = async (args: {
    requestUri?: string;
    inlineJwt?: string;
    verbose: boolean;
}): Promise<AuthorizationRequest> => {
    let jws: string;

    if (args.requestUri) {
        if (args.verbose) console.log(`\n[fetch] GET ${args.requestUri}`);

        const response = await fetch(args.requestUri);
        if (!response.ok) {
            throw new Error(
                `request_uri returned ${response.status} ${response.statusText}`
            );
        }
        jws = (await response.text()).trim();
    } else if (args.inlineJwt) {
        jws = args.inlineJwt;
    } else {
        throw new Error('decodeUnverifiedRequestObject needs either requestUri or inlineJwt');
    }

    // jose's decodeJwt + decodeProtectedHeader perform no signature
    // verification — exactly the behavior this harness needs.
    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;

    try {
        header = decodeProtectedHeader(jws) as Record<string, unknown>;
        payload = decodeJwt(jws) as Record<string, unknown>;
    } catch (e) {
        throw new Error(`Failed to decode Request Object JWS: ${describe(e)}`);
    }

    if (args.verbose) {
        console.log('\n[jws.header] (not verified)');
        console.log(pretty(header));
        console.log('\n[jws.payload] (not verified)');
        console.log(pretty(payload));
    }

    // Spec: the JWS payload contains the same claims an inline
    // Authorization Request URI would carry. Just rebuild our shape.
    const request: AuthorizationRequest = {
        client_id: asString(payload.client_id) ?? '<unknown>',
        client_id_scheme: asString(payload.client_id_scheme),
        response_type: asString(payload.response_type) ?? 'vp_token',
        response_mode: asString(payload.response_mode),
        response_uri: asString(payload.response_uri),
        redirect_uri: asString(payload.redirect_uri),
        nonce: asString(payload.nonce) ?? '<missing>',
        state: asString(payload.state),
        presentation_definition: (payload.presentation_definition as PresentationDefinition | undefined) ?? undefined,
        presentation_definition_uri: asString(payload.presentation_definition_uri),
        client_metadata: isObject(payload.client_metadata)
            ? (payload.client_metadata as Record<string, unknown>)
            : undefined,
        client_metadata_uri: asString(payload.client_metadata_uri),
        scope: asString(payload.scope),
    };

    return request;
};

const asString = (v: unknown): string | undefined =>
    typeof v === 'string' && v.length > 0 ? v : undefined;

const isObject = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === 'object' && !Array.isArray(v);

const pretty = (value: unknown): string => JSON.stringify(value, null, 2);

const truncate = (value: string, max: number): string =>
    value.length <= max ? value : value.slice(0, max - 1) + '…';

const describe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/* ----------------------------------- main ---------------------------------- */

const main = async (): Promise<void> => {
    const args = parseArgs(process.argv);

    console.log('\n=== OID4VP Try-Verify Harness ===\n');
    console.log(`Request URI: ${truncate(args.requestUri, 120)}`);

    /* 1. Parse the URI — or extract the JWS reference to decode unsafely. */
    const parsed = parseAuthorizationRequestUri(args.requestUri);
    console.log(`Parse mode: ${parsed.kind}`);

    let request: AuthorizationRequest;

    if (parsed.kind === 'by_value') {
        request = parsed.request;
    } else {
        if (!args.unsafeDecodeJws) {
            console.error(
                [
                    '',
                    '✗ This request uses a signed Request Object.',
                    '',
                    '  Slice 6 does not verify signed Request Objects — that work lives in Slice 7.',
                    '  Re-run with --unsafe-decode-jws to DECODE THE JWS WITHOUT VERIFYING IT',
                    '  so you can smoke-test the parser + PEX matcher + selector against real',
                    '  verifier traffic during development.',
                    '',
                    '  NEVER use --unsafe-decode-jws in production.',
                    '',
                ].join('\n')
            );
            process.exit(1);
        }

        console.log('\n⚠ UNSAFE MODE — decoding Request Object JWS without signature verification');
        console.log('  Enabled by --unsafe-decode-jws. Slice 7 replaces this with proper client_id_scheme verification.');

        request = await decodeUnverifiedRequestObject({
            requestUri: parsed.kind === 'by_reference_request_uri' ? parsed.requestUri : undefined,
            inlineJwt: parsed.kind === 'by_reference_request_jwt' ? parsed.jwt : undefined,
            verbose: args.verbose,
        });
    }

    /* 2. Resolve presentation_definition_uri if the request points at one. */
    if (!request.presentation_definition && request.presentation_definition_uri) {
        if (args.verbose)
            console.log(`\n[fetch] presentation_definition_uri → ${request.presentation_definition_uri}`);
        request.presentation_definition = await resolvePresentationDefinitionByReference(
            request.presentation_definition_uri
        );
    }

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

    if (error instanceof VpError) {
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
