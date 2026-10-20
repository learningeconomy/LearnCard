import React, { useId } from 'react';
import { ShareCredentialThumbnail } from './ShareCredentialThumbnail';
import { ShareCredentialMetadata } from './ShareCredentialMetadata';
import { CredentialPreviewButton } from './CredentialPreviewButton';
import { credentialText, type CredentialChoice } from './shareLinkFlow';
import * as m from '../../paraglide/messages.js';
import { getCredentialName } from 'learn-card-base/helpers/credentialHelpers';

/** Display-only selection row shared by link sharing and verifier selection/review. */
export const ShareCredentialSelectionRow = ({
    choice,
    checked,
    disabled,
    loadFailed,
    onToggle,
}: {
    choice: CredentialChoice;
    checked: boolean;
    disabled?: boolean;
    loadFailed?: boolean;
    onToggle: () => void;
}) => {
    const text = credentialText(choice.credential);
    const title = choice.credential ? text.name : getCredentialName(choice.credential);

    const checkboxId = useId();

    const handleRowClick = (event: React.MouseEvent) => {
        if (disabled) return;
        // Toggle on thumbnail/padding clicks; exclude button, label, and checkbox (label triggers checkbox natively)
        const target = event.target as HTMLElement;
        if (!target.closest('button') && !target.closest('label') && target.tagName !== 'INPUT') {
            onToggle();
        }
    };

    return (
        <div
            onClick={handleRowClick}
            aria-disabled={disabled}
            className={`flex items-center gap-4 p-4 rounded-[20px] border transition-colors ${
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${checked ? 'border-emerald-600 bg-emerald-50' : 'border-grayscale-200 hover:bg-grayscale-10'}`}
        >
            <ShareCredentialThumbnail credential={choice.credential} category={choice.category} />
            <label
                htmlFor={checkboxId}
                className={`flex-1 min-w-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className="block text-sm font-medium break-words">{title}</span>
                {choice.credential ? (
                    <ShareCredentialMetadata
                        credential={choice.credential}
                        category={choice.category}
                    />
                ) : (
                    <span className="block mt-1 text-xs text-grayscale-600">
                        {loadFailed ? m['shareLinks.loadFailed']() : m['shareLinks.loading']()}
                    </span>
                )}
            </label>
            {choice.credential && (
                <CredentialPreviewButton
                    credential={choice.credential}
                    category={choice.category}
                />
            )}
            <input
                id={checkboxId}
                type="checkbox"
                className="w-5 h-5 accent-emerald-600 shrink-0"
                checked={checked}
                disabled={disabled}
                onChange={onToggle}
            />
        </div>
    );
};
