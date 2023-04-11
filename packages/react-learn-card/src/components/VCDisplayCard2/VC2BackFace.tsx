import React from 'react';
import { format } from 'date-fns';

import MediaAttachmentsBox, { MediaMetadata, VideoMetadata } from './MediaAttachmentsBox';
import TruncateTextBox from './TruncateTextBox';
// import SkillsBox from './SkillsBox';
import IssueHistoryBox from './IssueHistoryBox';
import { VC, VerificationItem } from '@learncard/types';
import VerificationsBox from './VerificationsBox';
import { BoostAchievementCredential, IssueHistory } from '../../types';
import LeftArrow from '../svgs/LeftArrow';

/*
const defaultTagsToSkills = (tags: string[]) => {
    const skillsObj: { [skill: string]: string[] } = {};
    tags.forEach(tag => {
        skillsObj[tag] = [];
    });
};
*/

type VC2BackFaceProps = {
    credential: VC | BoostAchievementCredential;
    verificationItems: VerificationItem[];
    // convertTagsToSkills?: (tags: string[]) => { [skill: string]: string[] };
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string) => void;
    issueHistory?: IssueHistory[];
    showBackButton?: boolean;
    showFrontFace: () => void;
};

const VC2BackFace: React.FC<VC2BackFaceProps> = ({
    credential,
    verificationItems,
    // convertTagsToSkills = defaultTagsToSkills,
    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
    issueHistory,
    showBackButton,
    showFrontFace,
}) => {
    const expiration = credential.expirationDate
        ? format(new Date(credential.expirationDate), 'MMM dd, yyyy')
        : undefined;

    const achievement =
        'achievement' in credential.credentialSubject
            ? credential.credentialSubject.achievement
            : undefined;
    const criteria = achievement?.criteria?.narrative;

    /* 
    const tags = credential.credentialSubject.achievement?.tag;
    const skillsObject = tags && tags.length > 0 ? convertTagsToSkills(tags) : undefined;
    */

    return (
        <section className="vc-back-face flex flex-col gap-[20px] w-full px-[15px]">
            {showBackButton && (
                <div className="w-full">
                    <button
                        className="vc-card-back-button rounded-full h-[50px] px-[15px] flex items-center justify-center gap-[5px] z-50 text-[30px] text-white"
                        onClick={showFrontFace}
                    >
                        <LeftArrow className="text-white" size="25" />
                        Details
                    </button>
                </div>
            )}

            <TruncateTextBox
                headerText="About"
                text={achievement?.description}
                className="description-box"
            >
                {expiration && (
                    <p className="text-grayscale-800 font-poppins font-[600] text-[12px] leading-[18px] mb-0">
                        Expires on {expiration}
                    </p>
                )}
            </TruncateTextBox>
            {criteria && (
                <TruncateTextBox headerText="Criteria" text={criteria} className="criteria-box" />
            )}
            {/* {skillsObject && <SkillsBox skillsObject={skillsObject} />} */}

            {issueHistory && issueHistory?.length > 0 && (
                <IssueHistoryBox issueHistory={issueHistory} />
            )}

            {credential.attachments && credential.attachments.length > 0 && (
                <MediaAttachmentsBox
                    attachments={credential.attachments}
                    getFileMetadata={getFileMetadata}
                    getVideoMetadata={getVideoMetadata}
                    onMediaAttachmentClick={onMediaAttachmentClick}
                />
            )}
            {/* {credential.notes && <TruncateTextBox headerText="Notes" text={credential.notes} />} */}

            {verificationItems && verificationItems.length > 0 && (
                <VerificationsBox verificationItems={verificationItems} />
            )}
        </section>
    );
};

export default VC2BackFace;
