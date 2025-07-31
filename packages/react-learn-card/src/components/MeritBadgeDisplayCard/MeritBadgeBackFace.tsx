import React from 'react';
import { getCategoryDarkColor, getInfoFromCredential } from '../../helpers/credential.helpers';
import { VC, VerificationItem } from '@learncard/types';
import {
    BoostAchievementCredential,
    LCCategoryEnum,
    MediaMetadata,
    VideoMetadata,
} from '../../types';
import VerificationsBox from './VerificationsBox';
import AlignmentsBox from './AlignmentsBox';
import TruncateTextBox from './TruncateTextBox';
import MediaAttachmentsBox from './MediaAttachmentsBox';
import SkillsBox from '../VCDisplayCard2/SkillsBox';
import LeftArrow from '../svgs/LeftArrow';

type MeritBadgeBackFaceProps = {
    isFront?: boolean;
    credential: VC | BoostAchievementCredential;
    categoryType?: LCCategoryEnum;
    verificationItems: VerificationItem[];
    customSkillsComponent?: React.ReactNode;

    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    enableLightbox?: boolean;
    showBackButton?: boolean;
    handleViewFrontFace?: () => void;
    customLinkedCredentialsComponent?: React.ReactNode;
};

export const MeritBadgeBackFace: React.FC<MeritBadgeBackFaceProps> = ({
    credential,
    categoryType,
    verificationItems,
    customSkillsComponent,

    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
    enableLightbox,
    showBackButton,
    handleViewFrontFace,
    customLinkedCredentialsComponent,
}) => {
    const { createdAt, credentialSubject } = getInfoFromCredential(credential, 'MMM dd, yyyy', {
        uppercaseDate: false,
    });

    const { description } = credentialSubject?.achievement ?? {};
    const criteria = credentialSubject?.achievement?.criteria?.narrative;
    const alignment = credentialSubject?.achievement?.alignment;

    const credentialDarkColor = getCategoryDarkColor(categoryType);

    let bgColor = `bg-${credentialDarkColor}`;

    if (categoryType === LCCategoryEnum.accommodations) {
        bgColor = 'bg-amber-700';
    } else if (categoryType === LCCategoryEnum.accomplishments) {
        bgColor = 'bg-lime-700';
    }

    return (
        <div
            role="button"
            onClick={() => handleViewFrontFace?.()}
            className={`flex flex-col gap-[15px] items-center border-[5px] border-solid border-grayscale-200 py-[30px] px-[20px] rounded-[25px] max-w-[400px] ${bgColor}`}
        >
            {showBackButton ? (
                <div className="w-full">
                    <button
                        className="vc-card-back-button rounded-full h-[50px] px-[15px] flex items-center justify-center gap-[5px] z-50 text-[30px] text-white select-none"
                        onClick={() => handleViewFrontFace?.()}
                    >
                        <LeftArrow className="text-white" size="25" />
                        Details
                    </button>
                </div>
            ) : (
                <h1 className="text-white text-center text-[22px] font-jacques">Details</h1>
            )}

            <TruncateTextBox headerText="About" text={description}>
                <span
                    className={`text-grayscale-600 font-poppins text-[12px] font-[600] w-full ${
                        description
                            ? 'pt-[10px] border-t-[1px] border-solid border-grayscale-200'
                            : ''
                    }`}
                >
                    Awarded on {createdAt}
                </span>
            </TruncateTextBox>

            {criteria && <TruncateTextBox headerText="Criteria" text={criteria} />}

            {customLinkedCredentialsComponent && customLinkedCredentialsComponent}

            {(credential.skills?.length ?? 0) > 0 &&
                (customSkillsComponent ? (
                    customSkillsComponent
                ) : (
                    <SkillsBox skills={credential.skills ?? []} />
                ))}

            {credential.attachments && credential.attachments.length > 0 && (
                <MediaAttachmentsBox
                    attachments={credential.attachments}
                    getFileMetadata={getFileMetadata}
                    getVideoMetadata={getVideoMetadata}
                    onMediaAttachmentClick={onMediaAttachmentClick}
                    enableLightbox={enableLightbox}
                />
            )}

            {alignment && <AlignmentsBox alignment={alignment} style="MeritBadge" />}

            {verificationItems && verificationItems.length > 0 && (
                <VerificationsBox verificationItems={verificationItems} />
            )}

            {/* so that tailwind will put these colors in the css */}
            <span className="hidden bg-amber-700 bg-spice-700 bg-rose-700 bg-yellow-700 bg-teal-700"></span>
        </div>
    );
};

export default MeritBadgeBackFace;
