import React, { useMemo } from 'react';
import {
    resumeBuilderStore,
    RESUME_SECTIONS,
    ResumeSectionKey,
} from '../../../stores/resumeBuilderStore';
import { useGetResolvedCredentials } from 'learn-card-base';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

const ResumePreview: React.FC = () => {
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const selectedCredentialUris = resumeBuilderStore.useTracked.selectedCredentialUris();
    const allUris = useMemo(
        () => Object.values(selectedCredentialUris).flat().filter(Boolean),
        [selectedCredentialUris]
    );
    const resolvedResults = useGetResolvedCredentials(allUris);
    const resolvedMap = useMemo(() => {
        const map: Record<
            string,
            {
                title: string;
                issuer: string;
                date: string;
                description?: string;
                narrative?: string;
            }
        > = {};
        resolvedResults.forEach(result => {
            const vc = result.data;
            const uri = (result as any).uri;
            if (vc && uri) {
                const info = getInfoFromCredential(vc as any, 'MMM yyyy', { uppercaseDate: false });
                const rawIssuer =
                    typeof vc.issuer === 'string'
                        ? vc.issuer
                        : (vc.issuer as any)?.name ?? (vc.issuer as any)?.id ?? '';
                const issuerStr = rawIssuer.startsWith('did:') ? '' : rawIssuer;
                const subject = Array.isArray(vc.credentialSubject)
                    ? vc.credentialSubject[0]
                    : vc.credentialSubject;
                map[uri] = {
                    title: info.title ?? '',
                    issuer: issuerStr,
                    date: info.createdAt ?? '',
                    description: (subject as any)?.achievement?.description,
                    narrative: (subject as any)?.achievement?.criteria?.narrative,
                };
            }
        });
        return map;
    }, [resolvedResults]);
    const sectionOrder = resumeBuilderStore.useTracked.sectionOrder();

    const orderedSections = useMemo(() => {
        return sectionOrder
            .map(key => RESUME_SECTIONS.find(s => s.key === key))
            .filter(Boolean) as (typeof RESUME_SECTIONS)[number][];
    }, [sectionOrder]);

    const hasAnyContent = useMemo(() => {
        const hasPersonal = Object.values(personalDetails).some(v => v.trim());
        const hasCredentials = Object.values(selectedCredentialUris).some(
            arr => arr && arr.length > 0
        );
        return hasPersonal || hasCredentials;
    }, [personalDetails, selectedCredentialUris]);

    if (!hasAnyContent) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-grayscale-400 select-none">
                <div className="w-16 h-16 rounded-full bg-grayscale-100 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <p className="text-sm font-medium">Your resume will appear here</p>
                <p className="text-xs text-center max-w-[200px]">
                    Fill in your details and select credentials from the panel
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[760px] mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-lg p-10 min-h-[1000px] font-sans">
            {/* Header */}
            {(personalDetails.name ||
                personalDetails.email ||
                personalDetails.phone ||
                personalDetails.location) && (
                <div className="border-b border-grayscale-200 pb-6 mb-6">
                    {personalDetails.name && (
                        <h1 className="text-3xl font-bold text-grayscale-900 tracking-tight">
                            {personalDetails.name}
                        </h1>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-grayscale-600">
                        {personalDetails.email && <span>{personalDetails.email}</span>}
                        {personalDetails.phone && <span>{personalDetails.phone}</span>}
                        {personalDetails.location && <span>{personalDetails.location}</span>}
                    </div>
                    {personalDetails.summary && (
                        <p className="mt-3 text-sm text-grayscale-700 leading-relaxed">
                            {personalDetails.summary}
                        </p>
                    )}
                </div>
            )}

            {/* Sections */}
            {orderedSections.map(section => {
                const uris = selectedCredentialUris[section.key as ResumeSectionKey] ?? [];
                if (!uris.length) return null;

                return (
                    <div key={section.key} className="mb-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-grayscale-500 mb-3 border-b border-grayscale-100 pb-1">
                            {section.label}
                        </h2>
                        <div className="flex flex-col gap-3">
                            {uris.map(uri => {
                                const meta = resolvedMap[uri];
                                return (
                                    <div key={uri} className="flex items-start gap-3">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-sm font-semibold text-grayscale-800">
                                                {meta?.title || 'Credential'}
                                            </p>
                                            {(meta?.issuer || meta?.date) && (
                                                <p className="text-xs text-grayscale-500">
                                                    {[meta?.issuer, meta?.date]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                            )}
                                            {meta?.description && (
                                                <p className="text-xs text-grayscale-600 mt-0.5">
                                                    {meta.description}
                                                </p>
                                            )}
                                            {meta?.narrative && (
                                                <p className="text-xs text-grayscale-500 mt-0.5 italic">
                                                    {meta.narrative}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ResumePreview;
