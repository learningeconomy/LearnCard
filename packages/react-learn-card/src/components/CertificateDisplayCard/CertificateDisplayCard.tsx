import React, { useState } from 'react';
import { getCategoryColor } from '../../helpers/credential.helpers';
import { VC, Profile } from '@learncard/types';
import { BoostAchievementCredential, LCCategoryEnum, VerificationItem } from '../../types';
import CertificateFrontFace from './CertificateFrontFace';
import CertificateBackFace from './CertificateBackFace';
import { MediaMetadata, VideoMetadata } from './MediaAttachmentsBox';

type CertificateDisplayCardProps = {
    credential: VC | BoostAchievementCredential;
    categoryType?: LCCategoryEnum;
    verificationItems: VerificationItem[];
    issuerOverride?: Profile;

    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    enableLightbox?: boolean;
};

export const CertificateDisplayCard: React.FC<CertificateDisplayCardProps> = ({
    credential,
    categoryType,
    verificationItems,
    issuerOverride,

    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
    enableLightbox,
}) => {
    const [isFront, setIsFront] = useState(true);

    const credentialPrimaryColor = getCategoryColor(categoryType) ?? 'emerald-500';

    return (
        <section
            className={`border-solid border-[5px] border-grayscale-200 rounded-[30px] p-[13px] relative min-w-[250px] max-w-[300px] ${isFront ? 'bg-white' : `bg-${credentialPrimaryColor}`
                }`}
        >
            {isFront && (
                <CertificateFrontFace
                    credential={credential}
                    categoryType={categoryType}
                    issuerOverride={issuerOverride}
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

            <button
                className={`bg-${credentialPrimaryColor} text-white font-sacramento font-[600] py-[5px] px-[15px] rounded-full absolute bottom-[-50px] right-0 left-0 min-w-[200px]`}
                onClick={() => setIsFront(!isFront)}
            >
                FLIP IT
            </button>
        </section>
    );
};

export default CertificateDisplayCard;
