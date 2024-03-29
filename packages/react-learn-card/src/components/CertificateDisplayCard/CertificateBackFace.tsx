import React from 'react';
import { getInfoFromCredential } from '../../helpers/credential.helpers';
import { VC, VerificationItem } from '@learncard/types';
import { BoostAchievementCredential, LCCategoryEnum } from '../../types';
import VerificationsBox from './VerificationsBox';
import TruncateTextBox from './TruncateTextBox';
import MediaAttachmentsBox, { MediaMetadata, VideoMetadata } from './MediaAttachmentsBox';

type CertificateBackFaceProps = {
    credential: VC | BoostAchievementCredential;
    categoryType?: LCCategoryEnum;
    verificationItems: VerificationItem[];

    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    enableLightbox?: boolean;
};

const CertificateBackFace: React.FC<CertificateBackFaceProps> = ({
    credential,
    categoryType,
    verificationItems,

    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
    enableLightbox,
}) => {
    const { createdAt, credentialSubject } = getInfoFromCredential(credential, 'MMM dd, yyyy', {
        uppercaseDate: false,
    });

    const { description } = credentialSubject?.achievement ?? {};
    const criteria = credentialSubject?.achievement?.criteria?.narrative;

    return (
        <div className="flex flex-col gap-[15px] items-center py-[17px] px-[7px]">
            <h1 className="text-white text-center text-[22px] font-jacques">Details</h1>

            <TruncateTextBox headerText="About" text={description}>
                <span
                    className={`text-grayscale-600 font-poppins text-[12px] font-[600] w-full ${description
                            ? 'pt-[10px] border-t-[1px] border-solid border-grayscale-200'
                            : ''
                        }`}
                >
                    Awarded on {createdAt}
                </span>
            </TruncateTextBox>

            {criteria && <TruncateTextBox headerText="Criteria" text={criteria} />}

            {credential.attachments && credential.attachments.length > 0 && (
                <MediaAttachmentsBox
                    attachments={credential.attachments}
                    getFileMetadata={getFileMetadata}
                    getVideoMetadata={getVideoMetadata}
                    onMediaAttachmentClick={onMediaAttachmentClick}
                    enableLightbox={enableLightbox}
                />
            )}

            {verificationItems && verificationItems.length > 0 && (
                <VerificationsBox verificationItems={verificationItems} />
            )}
        </div>
    );
};

export default CertificateBackFace;
