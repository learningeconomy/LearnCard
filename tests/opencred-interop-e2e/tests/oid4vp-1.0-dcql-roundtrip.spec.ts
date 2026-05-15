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
    // SKIPPED — Plugin gap.
    //
    // OpenCred OID4VP-1.0 emits `client_id=decentralized_identifier:did:web:...`
    // in the URL but `client_id=did:web:...` inside the signed Request Object
    // payload (per OID4VP 1.0 §5.10 client-id-prefix semantics). The openid4vc
    // plugin's `verifyAndDecodeRequestObject` enforces strict equality between
    // outer-URL and signed `client_id`, rejecting the legal prefix-vs-bare
    // mismatch with RequestObjectError('client_id_mismatch', ...). Until the
    // plugin's outer-URL parser strips the OID4VP-1.0 prefix before the
    // equality check, this roundtrip can't complete.
    //
    // Same issue is documented in tests/openid4vc-interop-e2e/tests/eudi-parsing.spec.ts
    // — EUDI's reference verifier uses the same client_id format.
    it.skip('[plugin gap: OID4VP 1.0 prefix equality] LearnCard-issued LD-VC satisfies OpenCred DCQL query', async () => {
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
