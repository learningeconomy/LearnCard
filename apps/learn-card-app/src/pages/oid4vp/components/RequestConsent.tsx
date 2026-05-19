import React, { useMemo, useState, useEffect } from 'react';
import { Lock, ShieldAlert, Check } from 'lucide-react';

import { BoostPageViewMode, VerifierHeader, useWallet } from 'learn-card-base';
import {
    getDefaultCategoryForCredential,
    humanizeCredentialType,
} from 'learn-card-base/helpers/credentialHelpers';
import type { VC } from '@learncard/types';

import type {
    AuthorizationRequest,
    SelectionResult,
    DcqlSelectionResult,
    SdJwtDiscloseFrame,
} from '@learncard/openid4vc-plugin';

import type { PooledCandidate } from '../candidatePool';

import { BoostEarnedCard } from '../../../components/boost/boost-earned-card/BoostEarnedCard';

interface ParsedSdJwtForConsent {
    disclosureKeys?: string[];
    claims?: Record<string, unknown>;
}

interface SdJwtAwareInvoke {
    parseSdJwtVc?: (compact: string) => Promise<ParsedSdJwtForConsent>;
}

const humanizeClaimKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, str => str.toUpperCase()).trim();
};

/**
 * User’s per-row pick and per-claim choices.
 */
export interface ConsentPicks {
    row: Record<string, number>;
    disclose: Record<string, SdJwtDiscloseFrame>;
}

export interface RequestConsentProps {
    request: AuthorizationRequest;
    /** PEX selection \u2014 mutually exclusive with `dcqlSelection`. */
    selection?: SelectionResult;
    /** DCQL selection \u2014 mutually exclusive with `selection`. */
    dcqlSelection?: DcqlSelectionResult;

    /**
     * Called with the holder\u2019s per-row picks once they approve. Index
     * is into the row\u2019s `candidates` array, defaulting to 0.
     */
    onApprove: (picks: ConsentPicks) => void;
    onCancel: () => void;
}

/**
 * Consent screen for an incoming OID4VP presentation request. Surfaces:
 *
 *   - Verifier identity (host + display name from `client_metadata`)
 *   - "Encrypted response" affordance when the verifier asked for JARM
 *   - Reason ("purpose") the verifier offered, when present
 *   - Per-descriptor / per-DCQL-query rows showing what credential will
 *     be shared, with a candidate picker when the holder has multiple
 *     matches and a collapsible field-disclosure section
 *   - Approve / Cancel buttons
 *
 * Picks default to the first match per row; the user can override
 * inline. Rows the wallet can\u2019t satisfy disable Approve.
 */
const RequestConsent: React.FC<RequestConsentProps> = ({
    request,
    selection,
    dcqlSelection,
    onApprove,
    onCancel,
}) => {
    const verifierDisplay = useMemo(
        () => extractVerifierDisplay(request),
        [request]
    );

    /**
     * Branded display name when the request supplied `client_metadata.client_name`,
     * otherwise undefined — UI strings fall back to the generic “An app” phrasing.
     */
    const clientName = verifierDisplay?.name?.trim();
    const subjectLabel = clientName || 'An app';

    const purpose = useMemo(() => extractPurpose(request), [request]);
    const isJarm = request.response_mode === 'direct_post.jwt';

    const rows = useMemo(
        () => buildRows(request, selection, dcqlSelection),
        [request, selection, dcqlSelection]
    );

    /**
     * Per-row pick. Default to index 0 (the first match) for every row
     * that has at least one candidate. Rows with zero candidates stay
     * out of the map; `Approve` is disabled in that case anyway.
     */
    const [picks, setPicks] = useState<ConsentPicks>(() => {
        const initial: ConsentPicks = { row: {}, disclose: {} };
        for (const row of rows) {
            if (row.candidates.length > 0) initial.row[row.id] = 0;
        }
        return initial;
    });

    const { initWallet } = useWallet();
    const [parsedSdJwts, setParsedSdJwts] = useState<Record<string, ParsedSdJwtForConsent>>({});
    const [parsingSdJwts, setParsingSdJwts] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const parseSdJwts = async () => {
            const wallet = await initWallet();
            const newParsing: Record<string, boolean> = {};

            for (const row of rows) {
                const pickedIndex = picks.row[row.id] ?? 0;
                const candidate = row.candidates[pickedIndex]?.candidate;
                if (!candidate) continue;

                const compact = getSdJwtCompact(candidate.credential);
                const cacheKey = `${row.id}::${candidate.id}`;
                if (compact && !parsedSdJwts[cacheKey] && !parsingSdJwts[cacheKey]) {
                    newParsing[cacheKey] = true;
                }
            }

            if (Object.keys(newParsing).length > 0) {
                setParsingSdJwts(prev => ({ ...prev, ...newParsing }));
                
                for (const cacheKey of Object.keys(newParsing)) {
                    const [rowId, candidateId] = cacheKey.split('::');
                    const row = rows.find(r => r.id === rowId);
                    const candidate = row?.candidates.find(c => c.candidate.id === candidateId)?.candidate;
                    if (!candidate) continue;

                    const compact = getSdJwtCompact(candidate.credential);
                    if (compact) {
                        const invoke = wallet.invoke as unknown as SdJwtAwareInvoke;
                        if (typeof invoke.parseSdJwtVc !== 'function') continue;
                        try {
                            const parsed = await invoke.parseSdJwtVc(compact);
                            setParsedSdJwts(prev => ({ ...prev, [cacheKey]: parsed }));
                            
                            setPicks(prev => {
                                if (prev.disclose[rowId]) return prev;
                                const initialDisclose: Record<string, boolean> = {};
                                parsed.disclosureKeys?.forEach((key: string) => {
                                    initialDisclose[key] = true;
                                });
                                return {
                                    ...prev,
                                    disclose: {
                                        ...prev.disclose,
                                        [rowId]: initialDisclose
                                    }
                                };
                            });
                        } catch (e) {
                            console.error('Failed to parse SD-JWT', e);
                        }
                    }
                }

                setParsingSdJwts(prev => {
                    const next = { ...prev };
                    for (const key of Object.keys(newParsing)) {
                        delete next[key];
                    }
                    return next;
                });
            }
        };
        parseSdJwts();
    }, [rows, picks.row, initWallet]);

    const allRowsHaveCandidate = rows.every((r) => r.candidates.length > 0);

    const handlePickChange = (rowId: string, index: number) => {
        setPicks((prev) => ({ ...prev, row: { ...prev.row, [rowId]: index } }));
    };

    const handleClaimChange = (rowId: string, claimKey: string, checked: boolean) => {
        setPicks((prev) => {
            const currentDisclose = prev.disclose[rowId] || {};
            return {
                ...prev,
                disclose: {
                    ...prev.disclose,
                    [rowId]: {
                        ...currentDisclose,
                        [claimKey]: checked,
                    },
                },
            };
        });
    };

    return (
        <div
            className="min-h-full flex items-center justify-center font-poppins"
            style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                paddingRight: 'max(1rem, env(safe-area-inset-right))',
            }}
        >
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden">
                <div className="p-6 space-y-5">
                    <div>
                        <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                            Share credentials?
                        </h1>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {subjectLabel} is asking to see some of your credentials. Review what they&rsquo;ll see before sharing.
                        </p>
                    </div>

                    <VerifierHeader
                        clientId={request.client_id}
                        clientIdScheme={request.client_id_scheme}
                        display={verifierDisplay}
                    />

                    {isJarm && (
                        <div className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                            <Lock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-emerald-800">
                                    Encrypted response
                                </p>
                                <p className="text-xs text-emerald-700 leading-relaxed mt-0.5">
                                    Your reply is sealed to the requesting app&rsquo;s key, so only they can read it.
                                </p>
                            </div>
                        </div>
                    )}

                    {purpose && (
                        <div className="p-3 rounded-2xl bg-grayscale-10 border border-grayscale-200">
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                                Reason
                            </p>
                            <p className="text-sm text-grayscale-700 leading-relaxed">
                                {purpose}
                            </p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-medium text-grayscale-700 mb-2 uppercase tracking-wide">
                            Credentials to share
                        </p>

                        <ul className="space-y-2">
                            {rows.map((row) => {
                                const pickedIndex = picks.row[row.id] ?? 0;
                                const candidate = row.candidates[pickedIndex]?.candidate;
                                const cacheKey = candidate ? `${row.id}::${candidate.id}` : '';
                                return (
                                    <ConsentRow
                                        key={row.id}
                                        row={row}
                                        pickedIndex={pickedIndex}
                                        onPick={(idx) => handlePickChange(row.id, idx)}
                                        parsedSdJwt={parsedSdJwts[cacheKey]}
                                        isParsingSdJwt={parsingSdJwts[cacheKey]}
                                        discloseFrame={picks.disclose[row.id] as Record<string, boolean>}
                                        onClaimChange={(key, checked) => handleClaimChange(row.id, key, checked)}
                                        verifierName={subjectLabel}
                                    />
                                );
                            })}
                        </ul>
                    </div>

                    {!allRowsHaveCandidate && (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                            <ShieldAlert className="text-amber-500 w-5 h-5 mt-0.5 shrink-0" />

                            <span className="text-xs text-amber-800 leading-relaxed">
                                Some requested credentials aren&apos;t in your wallet, so the request may be rejected. You can still try.
                            </span>
                        </div>
                    )}

                    <div className="space-y-3 pt-1">
                        <button
                            onClick={() => onApprove(picks)}
                            disabled={!allRowsHaveCandidate}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Share
                        </button>

                        <button
                            onClick={onCancel}
                            className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------
// Row component
// -----------------------------------------------------------------

interface ConsentRowProps {
    row: ConsentRowModel;
    pickedIndex: number;
    onPick: (index: number) => void;
    parsedSdJwt?: ParsedSdJwtForConsent;
    isParsingSdJwt?: boolean;
    discloseFrame?: Record<string, boolean>;
    onClaimChange?: (claimKey: string, checked: boolean) => void;
    verifierName?: string;
}

const ConsentRow: React.FC<ConsentRowProps> = ({ row, pickedIndex, onPick, parsedSdJwt, isParsingSdJwt, discloseFrame, onClaimChange, verifierName }) => {
    const hasCandidate = row.candidates.length > 0;
    const hasMultiple = row.candidates.length > 1;

    return (
        <li className="rounded-xl border border-grayscale-200 bg-white p-4 space-y-3">
            <div>
                <p className="text-sm font-semibold text-grayscale-900">
                    {row.title}
                </p>

                {row.purpose && (
                    <p className="text-xs text-grayscale-500 leading-relaxed mt-0.5">
                        {row.purpose}
                    </p>
                )}
            </div>

            {!hasCandidate && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                        {row.reason ?? 'No matching credential in your wallet'}
                    </p>
                </div>
            )}

            {hasCandidate && !hasMultiple && row.candidates[0] && (
                <div className="flex justify-center pt-1">
                    <div className="w-[200px] shrink-0">
                        <BoostEarnedCard
                            credential={row.candidates[0].candidate.credential as VC}
                            categoryType={
                                getDefaultCategoryForCredential(
                                    row.candidates[0].candidate.credential as VC
                                ) || 'Achievement'
                            }
                            boostPageViewMode={BoostPageViewMode.Card}
                            useWrapper={false}
                            hideOptionsMenu
                            className="!mt-0 shadow-md"
                        />
                    </div>
                </div>
            )}

            {hasCandidate && hasMultiple && (
                <div className="space-y-2">
                    <p className="text-xs text-grayscale-500">
                        You have {row.candidates.length} that match — tap one to share.
                    </p>

                    <div className="flex gap-3 overflow-x-auto py-3 -mx-2 px-2">
                        {row.candidates.map((c, i) => {
                            const isPicked = i === pickedIndex;
                            return (
                                <button
                                    key={c.id || i}
                                    type="button"
                                    onClick={() => onPick(i)}
                                    aria-pressed={isPicked}
                                    className={`flex shrink-0 rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                        isPicked
                                            ? 'ring-2 ring-emerald-500'
                                            : 'opacity-60 hover:opacity-90'
                                    }`}
                                >
                                    <div className="pointer-events-none">
                                        <BoostEarnedCard
                                            credential={c.candidate.credential as VC}
                                            categoryType={
                                                getDefaultCategoryForCredential(
                                                    c.candidate.credential as VC
                                                ) || 'Achievement'
                                            }
                                            boostPageViewMode={BoostPageViewMode.Card}
                                            useWrapper={false}
                                            hideOptionsMenu
                                            className="!mt-0 shadow-md"
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {parsedSdJwt && (parsedSdJwt.disclosureKeys?.length ?? 0) > 0 && (
                <div className="mt-4 pt-4 border-t border-grayscale-200">
                    <p className="text-xs font-medium text-grayscale-700 mb-3 uppercase tracking-wide">
                        What you'll share
                    </p>
                    <p className="text-xs text-grayscale-500 leading-relaxed mb-3">
                        Uncheck anything you don't want to share with {verifierName}.
                    </p>
                    
                    <ul className="space-y-1 mb-4">
                        {(parsedSdJwt.disclosureKeys || []).map((key: string) => {
                            const val = parsedSdJwt.claims?.[key];
                            const isChecked = discloseFrame?.[key] ?? true;
                            return (
                                <li key={key}>
                                    <label className="flex items-start gap-3 p-2 rounded-xl hover:bg-grayscale-10 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => onClaimChange?.(key, e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className="mt-0.5 shrink-0">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-100 text-emerald-600' : 'bg-grayscale-200 text-transparent'}`}>
                                                <Check className="w-3 h-3" strokeWidth={3} />
                                            </div>
                                        </div>
                                        <div className={`flex flex-col min-w-0 transition-opacity ${isChecked ? 'opacity-100' : 'opacity-50'}`}>
                                            <span className="text-sm font-medium text-grayscale-900 truncate">
                                                {humanizeClaimKey(key)}
                                            </span>
                                            <span className="text-xs text-grayscale-500 truncate">
                                                {isChecked ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : 'hidden'}
                                            </span>
                                        </div>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                    <p className="text-xs text-grayscale-500 leading-relaxed">
                        Issuer name and credential type are always shared.
                    </p>
                </div>
            )}
            {isParsingSdJwt && (
                <div className="mt-4 pt-4 border-t border-grayscale-200">
                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-grayscale-200 rounded-xl">
                        <span className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-2" />
                        <span className="text-xs text-grayscale-500">Reading what's inside…</span>
                    </div>
                </div>
            )}
        </li>
    );
};


interface ConsentRowCandidate {
    candidate: PooledCandidate;
    /** Stable identifier for React keys; falls back to array index. */
    id?: string;
}

interface ConsentRowModel {
    id: string;
    title: string;
    purpose?: string;
    candidates: ConsentRowCandidate[];
    /** Why no candidates matched. */
    reason?: string;
}

const buildRows = (
  request: AuthorizationRequest,
  selection?: SelectionResult,
  dcqlSelection?: DcqlSelectionResult
): ConsentRowModel[] => {
  if (selection) {
    return selection.descriptors.map((d) => {
      const inputDescriptor = request.presentation_definition?.input_descriptors?.find(
        (id) => id.id === d.descriptorId
      );

      const candidates: ConsentRowCandidate[] = d.candidates.map((dc) => {
        const candidate = dc.candidate as PooledCandidate;
        return { candidate, id: candidate.id };
      });

      return {
        id: d.descriptorId,
        title:
          inputDescriptor?.name?.trim() ||
          humanizeCredentialType(d.descriptorId) ||
          d.descriptorId,
        purpose: inputDescriptor?.purpose,
        candidates,
        reason: d.reason,
      };
    });
  }

  if (dcqlSelection) {
    return Object.entries(dcqlSelection.matches).map(([queryId, match]) => {
      const candidates: ConsentRowCandidate[] = match.candidates.map((c) => {
        const candidate = c as PooledCandidate;
        return { candidate, id: candidate.id };
      });

      return {
        id: queryId,
        title: humanizeCredentialType(queryId) || queryId,
        candidates,
        reason: match.reason,
      };
    });
  }

  return [];
};

const extractVerifierDisplay = (request: AuthorizationRequest) => {
  const meta = request.client_metadata;
  if (!meta || typeof meta !== 'object') return undefined;

  const m = meta as Record<string, unknown>;
  return {
    name: stringField(m, 'client_name'),
    logoUri: stringField(m, 'logo_uri') ?? stringField(m, 'client_logo'),
    policyUri: stringField(m, 'policy_uri'),
    tosUri: stringField(m, 'tos_uri'),
  };
};

const extractPurpose = (request: AuthorizationRequest): string | undefined => {
  if (request.presentation_definition?.purpose) {
    return request.presentation_definition.purpose;
  }
  const firstDescriptorPurpose =
    request.presentation_definition?.input_descriptors?.find((d) => d.purpose)?.purpose;
  return firstDescriptorPurpose;
};

const stringField = (
    obj: Record<string, unknown>,
    key: string
): string | undefined => {
    const v = obj[key];
    return typeof v === 'string' && v.length > 0 ? v : undefined;
};

const getSdJwtCompact = (credential: unknown): string | undefined => {
    if (typeof credential === 'string' && credential.includes('~')) {
        return credential;
    }
    if (credential && typeof credential === 'object') {
        const proofValue = (credential as { proof?: unknown }).proof;
        const proof = Array.isArray(proofValue)
            ? proofValue.find(p => p && typeof p === 'object')
            : proofValue;
        if (proof && typeof proof === 'object') {
            const { type, jwt } = proof as { type?: unknown; jwt?: unknown };
            if (type === 'SdJwtCompactProof' && typeof jwt === 'string') {
                return jwt;
            }
        }
    }
    return undefined;
};

export default RequestConsent;
