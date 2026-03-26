import React, { useState } from 'react';
import { UploadTypesEnum } from 'learn-card-base';
import { useTheme } from '../../../../theme/hooks/useTheme';
import CredentialEditView from './CredentialEditView';
import { getWalletCategory, getCategoryDisplayLabel } from './AchievementTypeSelectorModal';

export type ParsedCredential = { vc: any; metadata?: { name?: string; category?: string } };

type Props = {
    credentials: ParsedCredential[];
    fileType: UploadTypesEnum;
    onConfirm: (selectedVcs: any[]) => void;
    onBack: () => void;
    isLoading?: boolean;
    onEditCredential?: (index: number, editedVc: any) => void;
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
    if (cred.metadata?.category) return getCategoryDisplayLabel(cred.metadata.category);
    const achievementType = cred.vc?.credentialSubject?.achievement?.achievementType;
    const type = Array.isArray(achievementType) ? achievementType[0] : achievementType;
    if (type) {
        const category = getWalletCategory(type);
        if (category) return category;
    }
    return cred.vc?.credentialSubject?.type || '';
};

export const CheckListCredentialReviewStep: React.FC<Props> = ({
    credentials,
    fileType,
    onConfirm,
    onBack,
    isLoading = false,
    onEditCredential,
}) => {
    const [selected, setSelected] = useState<Set<number>>(
        new Set(credentials.map((_, i) => i))
    );
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
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

    const handleEditSave = (editedVc: any) => {
        if (editingIndex !== null && onEditCredential) {
            onEditCredential(editingIndex, editedVc);
        }
        setEditingIndex(null);
    };

    if (editingIndex !== null) {
        return (
            <CredentialEditView
                credential={credentials[editingIndex]}
                onSave={handleEditSave}
                onBack={() => setEditingIndex(null)}
            />
        );
    }

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
                                className={`flex items-center justify-between px-4 py-3 rounded-[12px] border transition-colors ${
                                    isSelected
                                        ? `border-${primaryColor} bg-${primaryColor}/5`
                                        : 'border-grayscale-200 bg-grayscale-50'
                                }`}
                            >
                                <div
                                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                                    onClick={() => toggle(i)}
                                >
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
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-sm font-semibold text-grayscale-900 truncate">
                                            {name}
                                        </p>
                                        {category && (
                                            <p className="text-xs text-grayscale-500 mt-0.5">
                                                {category}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {onEditCredential && (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            setEditingIndex(i);
                                        }}
                                        className="p-1.5 rounded-full hover:bg-grayscale-100 ml-2"
                                    >
                                        <svg
                                            className="w-4 h-4 text-grayscale-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                            />
                                        </svg>
                                    </button>
                                )}
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
