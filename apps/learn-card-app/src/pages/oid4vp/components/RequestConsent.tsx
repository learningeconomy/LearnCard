import React, { useMemo, useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

import { BoostPageViewMode, VerifierHeader } from 'learn-card-base';
import {
    getDefaultCategoryForCredential,
    humanizeCredentialType,
} from 'learn-card-base/helpers/credentialHelpers';
import type { VC } from '@learncard/types';

import type {
    AuthorizationRequest,
    SelectionResult,
    DcqlSelectionResult,
} from '@learncard/openid4vc-plugin';

import type { PooledCandidate } from '../candidatePool';

import { BoostEarnedCard } from '../../../components/boost/boost-earned-card/BoostEarnedCard';

/**
 * User\u2019s per-row pick. Keys are PEX descriptor ids or DCQL credential
 * query ids; values are indices into that row\u2019s `candidates` array.
 */
export type ConsentPicks = Record<string, number>;

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
        const initial: ConsentPicks = {};
        for (const row of rows) {
            if (row.candidates.length > 0) initial[row.id] = 0;
        }
        return initial;
    });

    const allRowsHaveCandidate = rows.every((r) => r.candidates.length > 0);

    const handlePickChange = (rowId: string, index: number) => {
        setPicks((prev) => ({ ...prev, [rowId]: index }));
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
                            {rows.map((row) => (
                                <ConsentRow
                                    key={row.id}
                                    row={row}
                                    pickedIndex={picks[row.id] ?? 0}
                                    onPick={(idx) => handlePickChange(row.id, idx)}
                                />
                            ))}
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
}

const ConsentRow: React.FC<ConsentRowProps> = ({ row, pickedIndex, onPick }) => {
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
                    <div className="w-[160px] shrink-0">
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
                            className="shadow-md"
                        />
                    </div>
                </div>
            )}

            {hasCandidate && hasMultiple && (
                <div className="space-y-2">
                    <p className="text-xs text-grayscale-500">
                        You have {row.candidates.length} that match — tap one to share.
                    </p>

                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                        {row.candidates.map((c, i) => {
                            const isPicked = i === pickedIndex;
                            return (
                                <button
                                    key={c.id || i}
                                    type="button"
                                    onClick={() => onPick(i)}
                                    aria-pressed={isPicked}
                                    className={`w-[150px] shrink-0 rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                                        isPicked
                                            ? 'ring-2 ring-emerald-500 ring-offset-2'
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
                                            className="shadow-md"
                                        />
                                    </div>
                                </button>
                            );
                        })}
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

export default RequestConsent;
