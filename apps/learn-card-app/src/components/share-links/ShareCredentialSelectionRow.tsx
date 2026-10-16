import React from 'react';
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
    const title = choice.credential ? getCredentialName(choice.credential) : '';

    const handleRowClick = (event: React.MouseEvent) => {
        // Only toggle if not clicking the preview button or checkbox
        const target = event.target as HTMLElement;
        if (!target.closest('button') && target.tagName !== 'INPUT') {
            onToggle();
        }
    };

    return (
        <div
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onClick={handleRowClick}
            onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onToggle();
                }
            }}
            className={`flex items-center gap-4 p-4 rounded-[20px] border cursor-pointer transition-colors ${checked ? 'border-emerald-600 bg-emerald-50' : 'border-grayscale-200 hover:bg-grayscale-10'}`}
        >
            <ShareCredentialThumbnail credential={choice.credential} category={choice.category} />
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium break-words">
                    {title || text.name || choice.title || m['shareLinks.credential']()}
                </span>
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
            </span>
            {choice.credential && (
                <CredentialPreviewButton
                    credential={choice.credential}
                    category={choice.category}
                />
            )}
            <input
                type="checkbox"
                className="w-5 h-5 accent-emerald-600 shrink-0"
                checked={checked}
                disabled={disabled}
                onChange={onToggle}
            />
        </div>
    );
};
