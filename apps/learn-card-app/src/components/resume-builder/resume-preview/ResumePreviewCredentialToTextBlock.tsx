import React, { useRef, useState } from 'react';

import { useGetResolvedCredential } from 'learn-card-base';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import { ResumeField } from '../resume-builder.helpers';

type ResumePreviewCredentialBlockProps = {
    uri: string;
};

type EditableFieldProps = {
    value: string;
    placeholder: string;
    isEditing: boolean;
    isSelfAttested: boolean;
    onChange: (val: string) => void;
    onRemove?: () => void;
    multiline?: boolean;
};

const EditableField: React.FC<EditableFieldProps> = ({
    value,
    placeholder,
    isEditing,
    isSelfAttested,
    onChange,
    onRemove,
    multiline,
}) => {
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

    const commit = () => onChange(draft.trim());

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            commit();
        }
    };

    if (isEditing) {
        const sharedProps = {
            ref: inputRef as any,
            value: draft,
            placeholder,
            onKeyDown: handleKeyDown,
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
                setDraft(e.target.value);
                onChange(e.target.value);
            },
            className:
                'w-full text-xs text-grayscale-700 bg-indigo-50 border border-indigo-300 rounded px-2 py-1.5 outline-none resize-none leading-relaxed',
        };

        return (
            <div className="flex items-start gap-2">
                {multiline ? (
                    <textarea {...(sharedProps as any)} rows={3} />
                ) : (
                    <input {...(sharedProps as any)} type="text" />
                )}
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="shrink-0 text-grayscale-300 hover:text-red-400 text-sm mt-1.5 leading-none"
                        title="Remove"
                    >
                        ✕
                    </button>
                )}
            </div>
        );
    }

    if (!value) return null;

    return (
        <div className="flex items-start gap-1">
            <span
                className={`text-xs leading-relaxed flex-1 ${
                    isSelfAttested ? 'text-grayscale-600' : 'text-grayscale-600'
                }`}
            >
                {value}
            </span>
        </div>
    );
};

const ResumePreviewCredentialToTextBlock: React.FC<ResumePreviewCredentialBlockProps> = ({
    uri,
}) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const { data: vc } = useGetResolvedCredential(uri);

    const selfAttested = resumeBuilderStore.useTracked.selfAttested();
    const setSelfAttestedDescription = resumeBuilderStore.set.setSelfAttestedDescription;
    const addSelfAttestedDetail = resumeBuilderStore.set.addSelfAttestedDetail;
    const updateSelfAttestedDetail = resumeBuilderStore.set.updateSelfAttestedDetail;
    const removeSelfAttestedDetail = resumeBuilderStore.set.removeSelfAttestedDetail;

    const selfAttestedFields = selfAttested[uri] ?? { additionalDetails: [] };

    const info = vc ? getInfoFromCredential(vc as any, 'MMM yyyy', { uppercaseDate: false }) : null;
    const rawIssuer =
        vc && typeof vc.issuer === 'string'
            ? vc.issuer
            : (vc?.issuer as any)?.name ?? (vc?.issuer as any)?.id ?? '';
    const issuerStr = rawIssuer.startsWith('did:') ? '' : rawIssuer;
    const subject = vc
        ? Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject
        : null;

    const vcDescription: string =
        (subject as any)?.achievement?.description ||
        (subject as any)?.achievement?.criteria?.narrative ||
        '';

    const descriptionField: ResumeField = selfAttestedFields.description ?? {
        value: vcDescription,
        source: vcDescription ? 'vc' : 'selfAttested',
    };

    const handleDescriptionChange = (val: string) => {
        const source: ResumeField['source'] =
            val === vcDescription && vcDescription ? 'vc' : 'selfAttested';
        setSelfAttestedDescription(uri, { value: val, source });
    };

    const handleAddDetail = () => {
        addSelfAttestedDetail(uri, { value: '', source: 'selfAttested' });
    };

    return (
        <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {/* ── Locked anchor: title · issuer · date ── */}
                <p className="text-sm font-semibold text-grayscale-800">
                    {info?.title || 'Credential'}
                    {(issuerStr || info?.createdAt) && (
                        <span className="font-normal text-grayscale-500">
                            {' · '}
                            {[issuerStr, info?.createdAt].filter(Boolean).join(' · ')}
                        </span>
                    )}
                </p>

                {/* ── Description / criteria ── */}
                <EditableField
                    value={descriptionField.value}
                    placeholder="Add a description…"
                    isEditing={isEditing}
                    isSelfAttested={descriptionField.source === 'selfAttested'}
                    onChange={handleDescriptionChange}
                    multiline
                />

                {/* ── User-added additional details ── */}
                {selfAttestedFields.additionalDetails.map((detail, i) => (
                    <EditableField
                        key={i}
                        value={detail.value}
                        placeholder="Add detail…"
                        isEditing={isEditing}
                        isSelfAttested
                        onChange={val =>
                            updateSelfAttestedDetail(uri, i, { value: val, source: 'selfAttested' })
                        }
                        onRemove={() => removeSelfAttestedDetail(uri, i)}
                    />
                ))}

                {/* ── Add detail + Done buttons (edit mode only) ── */}
                {isEditing && (
                    <div className="flex items-center gap-3 mt-1">
                        <button
                            onClick={handleAddDetail}
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                        >
                            + Add detail
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="text-xs text-grayscale-400 hover:text-grayscale-600"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>

            {/* ── Edit toggle button ── */}
            <button
                onClick={() => setIsEditing(e => !e)}
                className={`shrink-0 mt-0.5 rounded-lg p-1.5 border transition-colors ${
                    isEditing
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-500'
                        : 'border-grayscale-200 bg-white text-grayscale-400 hover:border-indigo-300 hover:text-indigo-400'
                }`}
                title={isEditing ? 'Stop editing' : 'Edit'}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
            </button>
        </div>
    );
};

export default ResumePreviewCredentialToTextBlock;
