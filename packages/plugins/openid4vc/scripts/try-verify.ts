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

import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

import { decodeJwt, decodeProtectedHeader } from 'jose';

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

interface CliArgs {
    requestUri: string;
    credentialsPath?: string;
    unsafeDecodeJws: boolean;
    verbose: boolean;
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
    let unsafeDecodeJws = false;
    let verbose = false;

    for (let i = 0; i < args.length; i++) {
        const a = args[i];

        switch (a) {
            case '--credentials':
                credentialsPath = args[++i];
                break;
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

    return { requestUri, credentialsPath, unsafeDecodeJws, verbose };
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
    if (selection.canSatisfy) {
        const firstChoices: SelectedDescriptor[] = selection.descriptors.map((d, i) => {
            const candidate = d.candidates[0]!.candidate;
            return {
                descriptorId: d.descriptorId,
                format: candidate.format ?? 'ldp_vc',
                path: `$.verifiableCredential[${i}]`,
            };
        });

        const submission = buildPresentationSubmission(pd, firstChoices);

        console.log('\n--- Presentation Submission (first-match preview) ---');
        console.log(pretty(submission));

        const destination = request.response_uri ?? request.redirect_uri ?? '(no response target)';
        console.log(
            [
                '',
                '✓ Slice 6 complete — the wallet knows WHAT it would present.',
                '',
                '  Slice 7 will:',
                `    1. Wrap the selected credential(s) in a VerifiablePresentation`,
                `    2. Sign it with the holder's LearnCard key`,
                `    3. POST { vp_token, presentation_submission, state } to`,
                `         ${destination}`,
                '',
            ].join('\n')
        );
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
