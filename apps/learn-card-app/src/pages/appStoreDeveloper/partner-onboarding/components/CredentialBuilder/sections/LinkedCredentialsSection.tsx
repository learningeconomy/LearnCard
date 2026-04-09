/**
 * LinkedCredentialsSection - Read-only summary of embedded signed VCs in a CLR 2.0 credential.
 *
 * When a CLR uses verifiableCredential[] (pre-signed embedded VCs) instead of
 * or in addition to achievement[], this section displays them as a read-only list.
 * These are proof-bearing credentials that cannot be edited in the builder.
 */

import React, { useState } from 'react';
import { Link2, ChevronDown, ChevronRight, ShieldCheck, FileText } from 'lucide-react';

import { OBv3CredentialTemplate } from '../types';
import { CollapsibleSection } from '../FieldEditor';

interface LinkedCredentialsSectionProps {
    template: OBv3CredentialTemplate;
    isExpanded: boolean;
    onToggle: () => void;
}

// Extract a display name from an embedded VC
const getVcName = (vc: Record<string, unknown>): string => {
    const subject = vc.credentialSubject as Record<string, unknown> | undefined;

    if (subject) {
        const achievement = subject.achievement as Record<string, unknown> | undefined;

        if (achievement?.name && typeof achievement.name === 'string') {
            return achievement.name;
        }
    }

    if (typeof vc.name === 'string') return vc.name;

    const types = Array.isArray(vc.type) ? vc.type : [];
    const meaningful = types.filter((t: unknown) => t !== 'VerifiableCredential');

    if (meaningful.length > 0) return String(meaningful[0]);

    return 'Embedded Credential';
};

// Extract the achievement type from an embedded VC
const getVcAchievementType = (vc: Record<string, unknown>): string | undefined => {
    const subject = vc.credentialSubject as Record<string, unknown> | undefined;
    const achievement = subject?.achievement as Record<string, unknown> | undefined;

    if (achievement?.achievementType && typeof achievement.achievementType === 'string') {
        return achievement.achievementType;
    }

    return undefined;
};

// Extract issuer name from an embedded VC
const getVcIssuerName = (vc: Record<string, unknown>): string | undefined => {
    const issuer = vc.issuer;

    if (typeof issuer === 'string') return issuer;

    if (issuer && typeof issuer === 'object') {
        const issuerObj = issuer as Record<string, unknown>;

        if (typeof issuerObj.name === 'string') return issuerObj.name;
        if (typeof issuerObj.id === 'string') return issuerObj.id;
    }

    return undefined;
};

export const LinkedCredentialsSection: React.FC<LinkedCredentialsSectionProps> = ({
    template,
    isExpanded,
    onToggle,
}) => {
    const credentials = template.clrSubject?.verifiableCredential || [];
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    if (credentials.length === 0) return null;

    return (
        <CollapsibleSection
            title="Linked Credentials"
            icon={<Link2 className="w-4 h-4" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
            badge={`${credentials.length} signed`}
        >
            <div className="space-y-2">
                <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />

                        <p className="text-xs text-emerald-800">
                            These are pre-signed verifiable credentials embedded in this CLR.
                            They are read-only and will be preserved as-is in the output.
                        </p>
                    </div>
                </div>

                {credentials.map((vc, index) => {
                    const name = getVcName(vc);
                    const achievementType = getVcAchievementType(vc);
                    const issuerName = getVcIssuerName(vc);
                    const isExpanded = expandedIndex === index;
                    const hasProof = 'proof' in vc;

                    return (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {name}
                                    </p>

                                    <div className="flex items-center gap-2 mt-0.5">
                                        {achievementType && (
                                            <span className="text-xs text-gray-500">{achievementType}</span>
                                        )}

                                        {issuerName && (
                                            <span className="text-xs text-gray-400 truncate">
                                                by {issuerName}
                                            </span>
                                        )}

                                        {hasProof && (
                                            <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">
                                                signed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50 p-3">
                                    <pre className="text-xs text-gray-600 overflow-x-auto max-h-60 whitespace-pre-wrap font-mono">
                                        {JSON.stringify(vc, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </CollapsibleSection>
    );
};
