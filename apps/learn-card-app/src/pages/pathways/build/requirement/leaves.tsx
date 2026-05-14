/**
 * Leaf editors for every non-composite `NodeRequirement` kind.
 *
 * Each component takes a narrowly-typed `value` + `onChange` pair and
 * renders exactly the fields that kind needs. They're intentionally
 * tiny \u2014 the expressive work lives in the DSL's branch count, not
 * in any single editor.
 *
 * Shared conventions:
 *   - Imports `INPUT` / `LABEL` from `build/shared/inputs` so the
 *     visual language matches every other field in the Builder.
 *   - `null`-ing out an optional string on empty input (rather than
 *     storing `''`) keeps the schema tidy \u2014 matchers treat absent
 *     and empty identically, but serialisation prefers absent.
 *   - Validation hints render below the input as `text-[11px]
 *     text-grayscale-500`. Amber `alertCircleOutline` callouts surface
 *     only when the input's *format* is clearly wrong (CTID regex,
 *     URL parse); "empty string" is not a validation error in-flight
 *     \u2014 publish-time validation handles those.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';

import type { NodeRequirement } from '../../types';
import { ComparisonOpSchema } from '../../types/outcome';

import { INPUT, LABEL } from '../shared/inputs';

// ---------------------------------------------------------------------------
// Shared tiny helpers
// ---------------------------------------------------------------------------

const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-[11px] text-grayscale-500 leading-snug">{children}</p>
);

const InlineWarning: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
        <IonIcon
            icon={alertCircleOutline}
            aria-hidden
            className="text-amber-600 text-sm mt-0.5 shrink-0"
        />

        <p className="text-[11px] text-amber-800 leading-snug">{children}</p>
    </div>
);

const OptionalTag: React.FC = () => (
    <span className="text-grayscale-400 font-normal">(optional)</span>
);

const Field: React.FC<{
    id: string;
    label: React.ReactNode;
    children: React.ReactNode;
    hint?: React.ReactNode;
}> = ({ id, label, children, hint }) => (
    <div className="space-y-1.5">
        <label className={LABEL} htmlFor={id}>
            {label}
        </label>

        {children}

        {hint && <Hint>{hint}</Hint>}
    </div>
);

// ---------------------------------------------------------------------------
// 1. credential-type \u2014 VC `type` + optional issuer
// ---------------------------------------------------------------------------

export const CredentialTypeLeaf: React.FC<{
    value: Extract<NodeRequirement, { kind: 'credential-type' }>;
    onChange: (next: NodeRequirement) => void;
}> = ({ value, onChange }) => {
    const handleIssuer = (raw: string) => {
        const trimmed = raw.trim();

        onChange({
            kind: 'credential-type',
            type: value.type,
            ...(trimmed ? { issuer: trimmed } : {}),
        });
    };

    return (
        <div className="space-y-3">
            <Field
                id="req-credential-type"
                label="Credential type"
                hint={
                    <>
                        The <code className="font-mono">type</code> value on
                        the credential the learner will receive.
                        Case-insensitive; namespace prefixes are stripped
                        automatically.
                    </>
                }
            >
                <input
                    id="req-credential-type"
                    type="text"
                    className={INPUT}
                    value={value.type}
                    onChange={e =>
                        onChange({ ...value, type: e.target.value })
                    }
                    placeholder="e.g. AwsCloudEssentialsCompletion"
                />
            </Field>

            <Field
                id="req-credential-issuer"
                label={
                    <>
                        Issuer DID <OptionalTag />
                    </>
                }
                hint="Leave blank to accept any issuer that clears the trust tier."
            >
                <input
                    id="req-credential-issuer"
                    type="text"
                    className={INPUT}
                    value={value.issuer ?? ''}
                    onChange={e => handleIssuer(e.target.value)}
                    placeholder="did:web:learncard.app"
                />
            </Field>
        </div>
    );
};

// ---------------------------------------------------------------------------
// 2. boost-uri \u2014 canonical LearnCard boost URI
// ---------------------------------------------------------------------------

export const BoostUriLeaf: React.FC<{
    value: Extract<NodeRequirement, { kind: 'boost-uri' }>;
    onChange: (next: NodeRequirement) => void;
}> = ({ value, onChange }) => (
    <Field
        id="req-boost-uri"
        label="Boost URI"
        hint="Canonical LearnCard boost wallet URI. Exact-match, no namespace stripping."
    >
        <input
            id="req-boost-uri"
            type="text"
            className={INPUT}
            value={value.uri}
            onChange={e => onChange({ kind: 'boost-uri', uri: e.target.value })}
            placeholder="did:web:network.learncard.com/boost/..."
        />
    </Field>
);

// ---------------------------------------------------------------------------
// 3. ctdl-ctid \u2014 Credential Engine Registry CTID
// ---------------------------------------------------------------------------

const CTID_REGEX = /^ce-[0-9a-f-]{32,}$/i;

export const CtdlCtidLeaf: React.FC<{
    value: Extract<NodeRequirement, { kind: 'ctdl-ctid' }>;
    onChange: (next: NodeRequirement) => void;
}> = ({ value, onChange }) => {
    // Only warn once the author has typed something; an empty field
    // is "not yet filled in", not "formatted wrong".
    const showFormatWarning =
        value.ctid.trim().length > 0 && !CTID_REGEX.test(value.ctid.trim());

    return (
        <div className="space-y-2">
            <Field
                id="req-ctdl-ctid"
                label="CTID"
                hint={
                    <>
                        The Credential Engine Registry CTID, e.g.{' '}
                        <code className="font-mono">
                            ce-00000000-0000-0000-0000-000000000000
                        </code>
                        .
                    </>
                }
            >
                <input
                    id="req-ctdl-ctid"
                    type="text"
                    className={INPUT}
                    value={value.ctid}
                    onChange={e =>
                        onChange({
                            kind: 'ctdl-ctid',
                            ctid: e.target.value,
                        })
                    }
                    placeholder="ce-\u2026"
                />
            </Field>

            {showFormatWarning && (
                <InlineWarning>
                    That doesn't look like a CTID. Expected the form{' '}
                    <code className="font-mono">ce-</code> followed by a
                    hex UUID.
                </InlineWarning>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// 4. issuer-credential-id \u2014 W3C id scoped to an issuer DID
// ---------------------------------------------------------------------------

export const IssuerCredentialIdLeaf: React.FC<{
    value: Extract<NodeRequirement, { kind: 'issuer-credential-id' }>;
    onChange: (next: NodeRequirement) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-3">
        <Field
            id="req-issuer-did"
            label="Issuer DID"
            hint="The DID of the credential's issuer."
        >
            <input
                id="req-issuer-did"
                type="text"
                className={INPUT}
                value={value.issuerDid}
                onChange={e =>
                    onChange({
                        ...value,
                        issuerDid: e.target.value,
                    })
                }
                placeholder="did:web:\u2026"
            />
        </Field>

        <Field
            id="req-credential-id"
            label="Credential ID"
            hint="The VC's `id` field \u2014 unique within that issuer."
        >
            <input
                id="req-credential-id"
                type="text"
                className={INPUT}
                value={value.credentialId}
                onChange={e =>
                    onChange({
                        ...value,
                        credentialId: e.target.value,
                    })
                }
                placeholder="urn:uuid:\u2026"
            />
        </Field>
    </div>
);

// ---------------------------------------------------------------------------
// 5. ob-achievement \u2014 OBv3 achievement.id
// ---------------------------------------------------------------------------

export const ObAchievementLeaf: React.FC<{
    value: Extract<NodeRequirement, { kind: 'ob-achievement' }>;
    onChange: (next: NodeRequirement) => void;
}> = ({ value, onChange }) => (
    <Field
        id="req-ob-achievement"
        label="Achievement ID"
        hint={
            <>
                The OpenBadges{' '}
                <code className="font-mono">
                    credentialSubject.achievement.id
                </code>{' '}
                value. Any issuer whose VC carries this id counts.
            </>
        }
    >
        <input
            id="req-ob-achievement"
            type="text"
            className={INPUT}
            value={value.achievementId}
            onChange={e =>
                onChange({
                    kind: 'ob-achievement',
                    achievementId: e.target.value,
                })
            }
            placeholder="https://example.org/badges/aws-cloud-essentials"
        />
    </Field>
);

// ---------------------------------------------------------------------------
// 6. ob-alignment \u2014 OBv3 achievement.alignments[].targetUrl
// ---------------------------------------------------------------------------

const isProbablyUrl = (raw: string): boolean => {
    if (!raw.trim()) return true; // blank isn't a format error

    try {
        // eslint-disable-next-line no-new
        new URL(raw.trim());
        return true;
    } catch {
        return false;
    }
};

export const ObAlignmentLeaf: React.FC<{
    value: Extract<NodeRequirement, { kind: 'ob-alignment' }>;
    onChange: (next: NodeRequirement) => void;
}> = ({ value, onChange }) => {
    const showFormatWarning = !isProbablyUrl(value.targetUrl);

    return (
        <div className="space-y-2">
            <Field
                id="req-ob-alignment"
                label="Target URL"
                hint="Framework target URL from an OBv3 alignment. Any VC aligned to this target counts."
            >
                <input
                    id="req-ob-alignment"
                    type="url"
                    className={INPUT}
                    value={value.targetUrl}
                    onChange={e =>
                        onChange({
                            kind: 'ob-alignment',
                            targetUrl: e.target.value,
                        })
                    }
                    placeholder="https://case.example.org/framework/01"
                />
            </Field>

            {showFormatWarning && (
                <InlineWarning>
                    That doesn't parse as a URL. Expected a full URL including
                    the scheme.
                </InlineWarning>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// 7. skill-tag \u2014 normalised tag URI or local name
// ---------------------------------------------------------------------------

export const SkillTagLeaf: React.FC<{
    value: Extract<NodeRequirement, { kind: 'skill-tag' }>;
    onChange: (next: NodeRequirement) => void;
}> = ({ value, onChange }) => {
    const handleConfidence = (raw: string) => {
        if (raw.trim() === '') {
            onChange({
                kind: 'skill-tag',
                tag: value.tag,
            });

            return;
        }

        const n = Number(raw);
        if (!Number.isFinite(n)) return;

        onChange({
            kind: 'skill-tag',
            tag: value.tag,
            minConfidence: Math.max(0, Math.min(1, n)),
        });
    };

    return (
        <div className="space-y-3">
            <Field
                id="req-skill-tag"
                label="Skill tag"
                hint="A tag URI (CASE, ASN, O*NET, RSD) or a local tag name. String-equality match."
            >
                <input
                    id="req-skill-tag"
                    type="text"
                    className={INPUT}
                    value={value.tag}
                    onChange={e =>
                        onChange({
                            ...value,
                            tag: e.target.value,
                        })
                    }
                    placeholder="https://rsd.example.org/skills/aws-iam"
                />
            </Field>

            <Field
                id="req-skill-confidence"
                label={
                    <>
                        Minimum confidence <OptionalTag />
                    </>
                }
                hint="Reserved for future confidence-scored matching (0\u20131). Unused today; authored forward-compatibly."
            >
                <input
                    id="req-skill-confidence"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    className={INPUT}
                    value={value.minConfidence ?? ''}
                    onChange={e => handleConfidence(e.target.value)}
                    placeholder="0.8"
                />
            </Field>
        </div>
    );
};

// ---------------------------------------------------------------------------
// 8. score-threshold \u2014 numeric comparison on a credentialSubject field
// ---------------------------------------------------------------------------

const COMPARISON_OPS = ComparisonOpSchema.options; // ['>=', '>', '==', '<=', '<']

export const ScoreThresholdLeaf: React.FC<{
    value: Extract<NodeRequirement, { kind: 'score-threshold' }>;
    onChange: (next: NodeRequirement) => void;
}> = ({ value, onChange }) => {
    const handleIssuer = (raw: string) => {
        const trimmed = raw.trim();

        onChange({
            kind: 'score-threshold',
            type: value.type,
            field: value.field,
            op: value.op,
            value: value.value,
            ...(trimmed ? { issuer: trimmed } : {}),
        });
    };

    const handleValue = (raw: string) => {
        const n = Number(raw);
        if (!Number.isFinite(n)) return;

        onChange({ ...value, value: n });
    };

    return (
        <div className="space-y-3">
            <Field
                id="req-score-type"
                label="Credential type"
                hint="The VC type to match before checking the score."
            >
                <input
                    id="req-score-type"
                    type="text"
                    className={INPUT}
                    value={value.type}
                    onChange={e =>
                        onChange({
                            ...value,
                            type: e.target.value,
                        })
                    }
                    placeholder="SatScoreReport"
                />
            </Field>

            <Field
                id="req-score-field"
                label="Field path"
                hint={
                    <>
                        Dot path into the VC.{' '}
                        <code className="font-mono">
                            credentialSubject.score.total
                        </code>{' '}
                        walks nested objects.
                    </>
                }
            >
                <input
                    id="req-score-field"
                    type="text"
                    className={INPUT}
                    value={value.field}
                    onChange={e =>
                        onChange({
                            ...value,
                            field: e.target.value,
                        })
                    }
                    placeholder="credentialSubject.score"
                />
            </Field>

            <div className="grid grid-cols-2 gap-2">
                <Field id="req-score-op" label="Comparison">
                    <select
                        id="req-score-op"
                        className={INPUT}
                        value={value.op}
                        onChange={e =>
                            onChange({
                                ...value,
                                op: e.target.value as typeof value.op,
                            })
                        }
                    >
                        {COMPARISON_OPS.map(op => (
                            <option key={op} value={op}>
                                {op}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field id="req-score-value" label="Value">
                    <input
                        id="req-score-value"
                        type="number"
                        className={INPUT}
                        value={Number.isFinite(value.value) ? value.value : ''}
                        onChange={e => handleValue(e.target.value)}
                        placeholder="70"
                    />
                </Field>
            </div>

            <Field
                id="req-score-issuer"
                label={
                    <>
                        Issuer DID <OptionalTag />
                    </>
                }
                hint="Leave blank to accept any issuer that clears the trust tier."
            >
                <input
                    id="req-score-issuer"
                    type="text"
                    className={INPUT}
                    value={value.issuer ?? ''}
                    onChange={e => handleIssuer(e.target.value)}
                    placeholder="did:web:collegeboard.org"
                />
            </Field>
        </div>
    );
};
