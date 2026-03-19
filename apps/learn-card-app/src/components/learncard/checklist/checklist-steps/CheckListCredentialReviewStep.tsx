import React, { useState } from 'react';
import { UploadTypesEnum } from 'learn-card-base';
import { useTheme } from '../../../../theme/hooks/useTheme';

type ParsedCredential = { vc: any; metadata?: { name?: string; category?: string } };

type Props = {
    credentials: ParsedCredential[];
    fileType: UploadTypesEnum;
    onConfirm: (selectedVcs: any[]) => void;
    onBack: () => void;
    isLoading?: boolean;
};

const getCredentialDisplayName = (cred: ParsedCredential): string => {
    return (
        cred.metadata?.name ||
        cred.vc?.name ||
        cred.vc?.credentialSubject?.name ||
        cred.vc?.credentialSubject?.achievement?.name ||
        'Unnamed Credential'
    );
};

const getCredentialCategory = (cred: ParsedCredential): string => {
    return cred.metadata?.category || cred.vc?.credentialSubject?.type || '';
};

export const CheckListCredentialReviewStep: React.FC<Props> = ({
    credentials,
    fileType,
    onConfirm,
    onBack,
    isLoading = false,
}) => {
    const [selected, setSelected] = useState<Set<number>>(
        new Set(credentials.map((_, i) => i))
    );
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const toggleAll = () => {
        if (selected.size === credentials.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(credentials.map((_, i) => i)));
        }
    };

    const toggle = (index: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleConfirm = () => {
        const selectedVcs = Array.from(selected).map(i => credentials[i].vc);
        onConfirm(selectedVcs);
    };

    const allSelected = selected.size === credentials.length;

    return (
        <div className="w-full flex flex-col">
            <div className="w-full bg-white shadow-button-bottom px-6 pt-4 pb-4 mt-4 rounded-[15px]">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg text-grayscale-900 font-notoSans font-semibold">
                        Review Extracted Credentials
                    </h4>
                    <button
                        onClick={toggleAll}
                        className={`text-sm font-semibold text-${primaryColor}`}
                    >
                        {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                <p className="text-sm text-grayscale-600 font-notoSans mb-4">
                    {credentials.length === 0
                        ? 'No credentials were extracted from this file.'
                        : `Select the credentials you'd like to add to your LearnCard.`}
                </p>

                <ul className="w-full flex flex-col gap-2">
                    {credentials.map((cred, i) => {
                        const isSelected = selected.has(i);
                        const name = getCredentialDisplayName(cred);
                        const category = getCredentialCategory(cred);

                        return (
                            <li
                                key={i}
                                onClick={() => toggle(i)}
                                className={`flex items-center justify-between px-4 py-3 rounded-[12px] cursor-pointer border transition-colors ${
                                    isSelected
                                        ? `border-${primaryColor} bg-${primaryColor}/5`
                                        : 'border-grayscale-200 bg-grayscale-50'
                                }`}
                            >
                                <div className="flex flex-col min-w-0 pr-3">
                                    <p className="text-sm font-semibold text-grayscale-900 truncate">
                                        {name}
                                    </p>
                                    {category && (
                                        <p className="text-xs text-grayscale-500 mt-0.5">
                                            {category}
                                        </p>
                                    )}
                                </div>
                                <div
                                    className={`min-w-[22px] min-h-[22px] w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isSelected
                                            ? `bg-${primaryColor} border-${primaryColor}`
                                            : 'bg-white border-grayscale-300'
                                    }`}
                                >
                                    {isSelected && (
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="flex gap-3 mt-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-3 rounded-[30px] font-semibold text-grayscale-900 bg-grayscale-200"
                >
                    Back
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={`flex-1 py-3 rounded-[30px] font-semibold text-white bg-${primaryColor} disabled:opacity-50`}
                >
                    {isLoading ? 'Saving...' : `Save${selected.size > 0 ? ` (${selected.size})` : ''}`}
                </button>
            </div>
        </div>
    );
};

export default CheckListCredentialReviewStep;
