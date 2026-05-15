/**
 * OID4VP 1.0 + DCQL roundtrip — LearnCard ↔ OpenCred.
 *
 * Same wallet, same credential, different query language. Where the
 * draft18 spec exercises PEX presentation_definition, this spec hits
 * OpenCred's `OID4VP-1.0` profile which serializes its credential
 * request as DCQL (Digital Credentials Query Language).
 *
 * Key wire-shape difference (OID4VP 1.0 §6.4):
 *   - vp_token is an OBJECT keyed by `credential_query.id`
 *   - `presentation_submission` is FORBIDDEN
 *   - LearnCard plugin routes automatically based on `dcql_query`
 *     presence in the parsed Authorization Request.
 *
 * If LearnCard's DCQL pipeline drifts from OID4VP 1.0 wire shape,
 * OpenCred rejects with state=invalid.
 */
import { describe, expect, it } from 'vitest';

import { getLearnCard } from './helpers/learncard';
import { buildUnsignedBasicV1 } from './helpers/fixtures';
import {
    createExchange,
    inlineRequestUri,
    waitForExchangeComplete,
} from '../setup/opencred-client';

const OPENCRED_BASE_URL = process.env.OPENCRED_BASE_URL ?? 'http://localhost:22080';
const WORKFLOW_ID = 'lc-oid4vp10-jwt';
const CLIENT_SECRET = 'lc-interop-secret';

describe('interop: OpenCred OID4VP 1.0 + DCQL roundtrip', () => {
    // SKIPPED — upstream OpenCred bug, not LearnCard.
    //
    // The plugin's prefix-equality fix (vp/request-object.ts) and
    // OID4VP-1.0 `decentralized_identifier:` prefix support
    // (vp/client-id-prefix.ts) now route this flow correctly through
    // resolveAuthorizationRequest. What blocks the roundtrip is
    // OpenCred's DCQL output: it emits
    //
    //   meta.type_values: [
    //     "https://www.w3.org/2018/credentials#VerifiableCredential"
    //   ]
    //
    // but the OID4VP 1.0 §B.1 / DCQL `credential_query.meta.type_values`
    // schema for W3C VC requires `Array<Array<string>>` — an outer
    // array of alternative type sets, each an array of required types.
    // The plugin's DCQL parser (and the canonical `dcql` reference
    // library) enforces the spec shape, so OpenCred's flat array is
    // rejected with a schema error.
    //
    // Fixing this requires OpenCred upstream to wrap each type_values
    // element in an extra array. Filed upstream at
    // https://github.com/stateofca/opencred (see audit notes); this
    // test re-activates when OpenCred ships the fix.
    it.skip('[upstream OpenCred bug: malformed DCQL type_values] LearnCard-issued LD-VC satisfies OpenCred DCQL query', async () => {
        const wallet = await getLearnCard('b'.repeat(64));

        const unsigned = buildUnsignedBasicV1(wallet);
        const signedVc = await wallet.invoke.issueCredential(unsigned);

        const exchange = await createExchange({
            opencredBaseUrl: OPENCRED_BASE_URL,
            workflowId: WORKFLOW_ID,
            clientSecret: CLIENT_SECRET,
            qrProtocol: 'OID4VP-1.0',
        });

        const oid4vp10Uri = exchange.protocols?.['OID4VP-1.0'];
        expect(oid4vp10Uri).toBeDefined();
        const authRequestUri = await inlineRequestUri(oid4vp10Uri!);

        const resolved = await wallet.invoke.resolveAuthorizationRequest(authRequestUri!);

        expect(resolved.dcql_query).toBeDefined();
        expect(resolved.presentation_definition).toBeUndefined();

        const dcqlQuery = resolved.dcql_query as {
            credentials: Array<{ id: string }>;
        };
        expect(dcqlQuery.credentials.length).toBeGreaterThan(0);

        const chosen = [
            {
                credentialQueryId: dcqlQuery.credentials[0]!.id,
                candidate: {
                    credential: signedVc,
                    format: 'ldp_vc' as const,
                },
            },
        ];

        const present = await wallet.invoke.presentCredentials(authRequestUri!, chosen);

        expect(present.submitted).toBeDefined();
        expect(present.submitted.status).toBeGreaterThanOrEqual(200);
        expect(present.submitted.status).toBeLessThan(400);

        const finalStatus = await waitForExchangeComplete(
            OPENCRED_BASE_URL,
            WORKFLOW_ID,
            exchange.exchangeId,
            exchange.accessToken
        );

        expect(finalStatus.state).toBe('complete');
        expect(finalStatus.errors).toBeFalsy();
    });
});
