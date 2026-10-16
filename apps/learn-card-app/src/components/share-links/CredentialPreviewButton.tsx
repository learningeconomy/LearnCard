import React from 'react';
import { Eye } from 'lucide-react';
import type { VC } from '@learncard/types';
import * as m from '../../paraglide/messages.js';
import { useModal, ModalTypes, BoostCategoryOptionsEnum, useGetVCInfo } from 'learn-card-base';
import {
    getDefaultCategoryForCredential,
    isBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import BoostPreview from '../boost/boostCMS/BoostPreview/BoostPreview';
import NonBoostPreview from '../boost/boostCMS/BoostPreview/NonBoostPreview';
import CredentialBadgeNew from 'learn-card-base/components/CredentialBadge/CredentialBadgeNew';

interface CredentialPreviewButtonProps {
    credential: VC;
    category?: string;
    className?: string;
}

/** Reusable Eye button that opens a fullscreen credential preview modal. */
export const CredentialPreviewButton: React.FC<CredentialPreviewButtonProps> = ({
    credential,
    category,
    className = 'shrink-0 p-2 rounded-full text-grayscale-600 bg-transparent hover:bg-grayscale-200 hover:text-grayscale-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors',
}) => {
    const { newModal, closeModal } = useModal();

    const categoryType =
        (category as BoostCategoryOptionsEnum) ||
        (getDefaultCategoryForCredential(credential) as BoostCategoryOptionsEnum) ||
        BoostCategoryOptionsEnum.achievement;

    const {
        title,
        achievementType,
        badgeThumbnail,
        displayType,
        backgroundImage,
        backgroundColor,
        accentColor,
    } = useGetVCInfo(credential, categoryType);

    const handleViewCredential = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const isBoost = isBoostCredential(credential);

        const previewProps = {
            credential,
            categoryType,
            verificationItems: [],
            customThumbComponent: (
                <CredentialBadgeNew
                    achievementType={achievementType}
                    fallbackCircleText={title}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail ?? ''}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                    credential={credential}
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

    return (
        <button
            type="button"
            onClick={handleViewCredential}
            aria-label={m['shareLinks.viewCredential']()}
            className={className}
        >
            <Eye className="w-5 h-5" />
        </button>
    );
};

export default CredentialPreviewButton;
