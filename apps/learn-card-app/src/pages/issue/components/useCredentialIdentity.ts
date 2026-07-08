import { useEffect, useMemo, useRef, useState } from 'react';

import { getLogger } from 'learn-card-base';

import { detectSchemaType } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { validateCredentialJsonLd } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd';
import type { CredentialSchemaType } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

const log = getLogger('credential-identity');

export type CredentialIdentity =
    | { status: 'empty' }
    | { status: 'checking'; schema: CredentialSchemaType }
    | { status: 'valid'; schema: CredentialSchemaType; label: string }
    | { status: 'invalid'; reason: string; schema?: CredentialSchemaType };

const SCHEMA_LABELS: Record<CredentialSchemaType, string> = {
    obv3: 'Open Badges 3.0',
    clr2: 'Comprehensive Learner Record 2.0',
    custom: 'Verifiable Credential',
};

export const schemaLabel = (schema: CredentialSchemaType): string => SCHEMA_LABELS[schema];

/**
 * Derive a live "what is this credential, and is it valid?" signal from an
 * issuable JSON object. Runs the same two checks the issue path relies on —
 * `detectSchemaType` (synchronous, drives the standard badge) and
 * `validateCredentialJsonLd` (debounced JSON-LD expansion, drives validity) —
 * so the badge and the Issue button can never disagree.
 *
 * `parseError` lets a raw-JSON editor short-circuit the signal to "invalid"
 * while the user is mid-edit and the object can't be parsed at all.
 */
export const useCredentialIdentity = (
    credential: Record<string, unknown> | null,
    parseError?: string | null,
    debounceMs = 400
): CredentialIdentity => {
    const [identity, setIdentity] = useState<CredentialIdentity>({ status: 'empty' });
    const seq = useRef(0);

    // Stable structural key: re-validate only when the JSON content actually
    // changes, not on every referential churn from upstream memos.
    const json = useMemo(() => (credential ? JSON.stringify(credential) : ''), [credential]);

    useEffect(() => {
        if (parseError) {
            setIdentity({ status: 'invalid', reason: parseError });
            return;
        }

        if (!json) {
            setIdentity({ status: 'empty' });
            return;
        }

        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(json) as Record<string, unknown>;
        } catch {
            setIdentity({ status: 'invalid', reason: 'This credential isn’t valid JSON.' });
            return;
        }

        const schema = detectSchemaType(parsed);
        setIdentity({ status: 'checking', schema });

        const ticket = ++seq.current;
        const handle = setTimeout(async () => {
            try {
                const result = await validateCredentialJsonLd(parsed, {
                    allowRemoteContexts: true,
                });
                if (ticket !== seq.current) return;
                if (result.valid) {
                    setIdentity({ status: 'valid', schema, label: SCHEMA_LABELS[schema] });
                } else {
                    setIdentity({
                        status: 'invalid',
                        schema,
                        reason: result.errors[0] ?? 'This credential isn’t valid yet.',
                    });
                }
            } catch (e) {
                if (ticket !== seq.current) return;
                log.warn('identity.validate_failed', e);
                setIdentity({
                    status: 'invalid',
                    schema,
                    reason: 'We couldn’t validate this credential. Please review and try again.',
                });
            }
        }, debounceMs);

        return () => clearTimeout(handle);
    }, [json, parseError, debounceMs]);

    return identity;
};
