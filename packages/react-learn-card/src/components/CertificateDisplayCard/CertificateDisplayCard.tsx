import React, { useState } from 'react';
import { VC, Profile, VerificationItem } from '@learncard/types';
import {
    BoostAchievementCredential,
    LCCategoryEnum,
    MediaMetadata,
    VideoMetadata,
} from '../../types';
import CertificateFrontFace from './CertificateFrontFace';
import CertificateBackFace from './CertificateBackFace';
import FatArrow from '../svgs/FatArrow';
import ThreeDots from '../../assets/images/DotsThreeOutline.svg';

type CertificateDisplayCardProps = {
    credential: VC | BoostAchievementCredential;
    categoryType?: LCCategoryEnum;
    verificationItems: VerificationItem[];
    issuerOverride?: Profile;
    issueeOverride?: Profile;
    trustedAppRegistry?: any[];
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    customBodyCardComponent?: React.ReactNode;
    hideIssueDate?: boolean;
    customSkillsComponent?: React.ReactNode;
    customBackfaceComponent?: React.ReactNode;
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    enableLightbox?: boolean;

    handleXClick?: () => void;
    onDotsClick?: () => void;
    isFrontOverride?: boolean;
    setIsFrontOverride?: (value: boolean) => void;
    hideNavButtons?: boolean;
    showBackButton?: boolean;
    showDetailsBtn?: boolean;
};

export const CertificateDisplayCard: React.FC<CertificateDisplayCardProps> = ({
    credential,
    categoryType,
    verificationItems,
    issuerOverride,
    issueeOverride,
    subjectImageComponent,
    issuerImageComponent,
    customBodyCardComponent,
    trustedAppRegistry,
    hideIssueDate,
    customSkillsComponent,
    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
    enableLightbox,
    handleXClick,
    onDotsClick,
    isFrontOverride,
    setIsFrontOverride,
    hideNavButtons,
    showBackButton = false,
    showDetailsBtn = false,
    customBackfaceComponent,
}) => {
    const [_isFront, _setIsFront] = useState(isFrontOverride ?? true);
    const isFront = isFrontOverride ?? _isFront;
    const setIsFront = setIsFrontOverride ?? _setIsFront;

    return (
        <section className="w-full flex flex-col gap-[15px] justify-center relative min-w-[220px]">
            <section className="certificate-wrapper flex justify-center">
                {isFront && (
                    <CertificateFrontFace
                        credential={credential}
                        categoryType={categoryType}
                        issuerOverride={issuerOverride}
                        issueeOverride={issueeOverride}
                        trustedAppRegistry={trustedAppRegistry}
                        subjectImageComponent={subjectImageComponent}
                        issuerImageComponent={issuerImageComponent}
                        customBodyCardComponent={customBodyCardComponent}
                        hideIssueDate={hideIssueDate}
                        handleViewBackFace={() => setIsFront(!isFront)}
                        isFront={isFront}
                        showDetailsBtn={showDetailsBtn}
                    />
                )}

                {!isFront && !customBackfaceComponent && (
                    <CertificateBackFace
                        credential={credential}
                        categoryType={categoryType}
                        verificationItems={verificationItems}
                        getFileMetadata={getFileMetadata}
                        getVideoMetadata={getVideoMetadata}
                        onMediaAttachmentClick={onMediaAttachmentClick}
                        enableLightbox={enableLightbox}
                        showBackButton={(showBackButton && !hideNavButtons) || showDetailsBtn}
                        handleViewFrontFace={() => setIsFront(!isFront)}
                    />
                )}

                {!isFront && customBackfaceComponent && { customBackfaceComponent }}

                {onDotsClick && (
                    <button
                        className="absolute right-[-20px] top-[-52px] bg-white rounded-full p-[10px] shadow-bottom"
                        onClick={onDotsClick}
                    >
                        <img
                            alt="Menu dropdown icon"
                            className="h-[20px] w-[20px]"
                            src={ThreeDots}
                        />
                    </button>
                )}
            </section>

            {!hideNavButtons && (
                <div className="flex gap-[10px] font-mouse text-[30px] leading-[28px] tracking-[0.75px] relative top-[-10px] left-0 w-full">
                    {!isFront && (
                        <button
                            className="bg-grayscale-900 text-white py-[15px] px-[20px] rounded-[20px] flex mx-auto justify-center items-center gap-[5px] border-[3px] border-solid border-white"
                            onClick={() => setIsFront(!isFront)}
                        >
                            <FatArrow direction="left" /> Back
                        </button>
                    )}

                    {handleXClick && (
                        <button
                            onClick={handleXClick}
                            className="bg-white text-grayscale-900 rounded-[20px] py-[15px] px-[20px] grow"
                        >
                            Close
                        </button>
                    )}

                    {isFront && (
                        <button
                            className="bg-grayscale-900 text-white py-[15px] px-[20px] rounded-[20px] mx-auto flex justify-center items-center gap-[5px] border-[3px] border-solid border-white"
                            onClick={() => setIsFront(!isFront)}
                        >
                            Details <FatArrow direction="right" />
                        </button>
                    )}
                </div>
            )}
        </section>
    );
};

export default CertificateDisplayCard;
