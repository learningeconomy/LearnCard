import React, { useState } from 'react';
import { VC, Profile } from '@learncard/types';
import { BoostAchievementCredential, LCCategoryEnum, VerificationItem } from '../../types';
import CertificateFrontFace from './CertificateFrontFace';
import CertificateBackFace from './CertificateBackFace';
import { MediaMetadata, VideoMetadata } from './MediaAttachmentsBox';
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

    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    enableLightbox?: boolean;

    handleXClick?: () => void;
    onDotsClick?: () => void;
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

    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
    enableLightbox,

    handleXClick,
    onDotsClick,
}) => {
    const [isFront, setIsFront] = useState(true);

    return (
        <section
            className={`w-full border-solid border-[5px] border-grayscale-200 rounded-[30px] relative min-w-[250px] max-w-[300px] ${isFront ? 'bg-white p-[13px]' : ``
                }`}
        >
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
                />
            )}

            {!isFront && (
                <CertificateBackFace
                    credential={credential}
                    categoryType={categoryType}
                    verificationItems={verificationItems}
                    getFileMetadata={getFileMetadata}
                    getVideoMetadata={getVideoMetadata}
                    onMediaAttachmentClick={onMediaAttachmentClick}
                    enableLightbox={enableLightbox}
                />
            )}

            <div className="flex gap-[10px] font-mouse text-[30px] leading-[28px] tracking-[0.75px] absolute bottom-[-83px] left-0 w-full">
                {!isFront && (
                    <button
                        className="bg-grayscale-900 text-white py-[15px] px-[20px] rounded-[20px] flex justify-center items-center gap-[5px] border-[3px] border-solid border-white"
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
                        className="bg-grayscale-900 text-white py-[15px] px-[20px] rounded-[20px] grow flex justify-center items-center gap-[5px] border-[3px] border-solid border-white"
                        onClick={() => setIsFront(!isFront)}
                    >
                        Details <FatArrow direction="right" />
                    </button>
                )}
            </div>

            {onDotsClick && (
                <button
                    className="absolute right-[-20px] top-[-52px] bg-white rounded-full p-[10px] shadow-bottom"
                    onClick={onDotsClick}
                >
                    <img alt="Menu dropdown icon" className="h-[20px] w-[20px]" src={ThreeDots} />
                </button>
            )}
        </section>
    );
};

export default CertificateDisplayCard;
