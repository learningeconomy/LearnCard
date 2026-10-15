import React from 'react';
import { Eye } from 'lucide-react';
import { ShareCredentialThumbnail } from './ShareCredentialThumbnail';
import { ShareCredentialMetadata } from './ShareCredentialMetadata';
import { credentialText, type CredentialChoice } from './shareLinkFlow';
import * as m from '../../paraglide/messages.js';
import { useModal, ModalTypes, BoostCategoryOptionsEnum, useGetVCInfo } from 'learn-card-base';
import {
    getDefaultCategoryForCredential,
    isBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import BoostPreview from '../boost/boostCMS/BoostPreview/BoostPreview';
import NonBoostPreview from '../boost/boostCMS/BoostPreview/NonBoostPreview';
import CredentialBadgeNew from 'learn-card-base/components/CredentialBadge/CredentialBadgeNew';

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
    const { newModal, closeModal } = useModal();

    const categoryType =
        (choice.category as BoostCategoryOptionsEnum) ||
        (choice.credential
            ? (getDefaultCategoryForCredential(choice.credential) as BoostCategoryOptionsEnum)
            : undefined) ||
        BoostCategoryOptionsEnum.achievement;

    const {
        title,
        achievementType,
        badgeThumbnail,
        displayType,
        backgroundImage,
        backgroundColor,
        accentColor,
    } = useGetVCInfo(choice.credential!, categoryType);

    const handleViewCredential = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!choice.credential) return;

        const isBoost = isBoostCredential(choice.credential);

        const previewProps = {
            credential: choice.credential,
            categoryType,
            verificationItems: [] as [],
            customThumbComponent: (
                <CredentialBadgeNew
                    achievementType={achievementType}
                    fallbackCircleText={title}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail ?? ''}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                    credential={choice.credential}
                    showBackgroundImage
                    backgroundImage={backgroundImage}
                    backgroundColor={backgroundColor}
                    accentColor={accentColor}
                    displayType={displayType}
                />
            ),
            customBodyCardComponent: null,
            customFooterComponent: <div />,
            customIssueHistoryComponent: null,
            handleCloseModal: () => closeModal(),
            titleOverride: title,
            displayType,
            isEarnedBoost: true,
            showEndorsementBadge: true,
        };

        const PreviewComponent = isBoost ? BoostPreview : NonBoostPreview;

        newModal(
            <PreviewComponent {...previewProps} />,
            {
                className: '!bg-transparent',
                hideButton: true,
                backgroundImage:
                    displayType === 'certificate' || displayType === 'award'
                        ? backgroundImage
                        : undefined,
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };
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
                    {text.name || choice.title || m['shareLinks.credential']()}
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
                <button
                    type="button"
                    onClick={handleViewCredential}
                    aria-label={m['shareLinks.viewCredential']()}
                    className="shrink-0 p-2 rounded-full text-grayscale-600 bg-transparent hover:bg-grayscale-200 hover:text-grayscale-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
                >
                    <Eye className="w-5 h-5" />
                </button>
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
