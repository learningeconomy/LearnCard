import React from 'react';
import { format } from 'date-fns';
import { Flipped } from 'react-flip-toolkit';

import MediaAttachmentsBox from './MediaAttachmentsBox';
import TruncateTextBox from './TruncateTextBox';
import SkillsBox from './SkillsBox';
import IssueHistoryBox from './IssueHistoryBox';
import type { VC, VerificationItem } from '@learncard/types';
import VerificationsBox from './VerificationsBox';
import AlignmentsBox from '../CertificateDisplayCard/AlignmentsBox';
import type {
    BoostAchievementCredential,
    IssueHistory,
    MediaMetadata,
    VideoMetadata,
} from '../../types';
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
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    issueHistory?: IssueHistory[];
    showBackButton?: boolean;
    showFrontFace: () => void;
    customDescription?: React.ReactNode;
    customCriteria?: React.ReactNode;
    customSkillsComponent?: React.ReactNode;
    customIssueHistoryComponent?: React.ReactNode;
    enableLightbox?: boolean;
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
    customDescription,
    customCriteria,
    customSkillsComponent,
    customIssueHistoryComponent,
    enableLightbox,
}) => {
    const expiration = credential.expirationDate
        ? format(new Date(credential.expirationDate), 'MMM dd, yyyy')
        : undefined;

    const isExpired =
        credential.expirationDate &&
        Number(new Date(credential.expirationDate)) < Number(new Date());

    const achievement =
        'achievement' in credential.credentialSubject
            ? credential.credentialSubject.achievement
            : undefined;
    const criteria = achievement?.criteria?.narrative;
    const description = achievement?.description;
    const alignment = achievement?.alignment;

    /* 
    const tags = credential.credentialSubject.achievement?.tag;
    const skillsObject = tags && tags.length > 0 ? convertTagsToSkills(tags) : undefined;
    */

    return (
        <Flipped inverseFlipId="card">
            <section className="vc-back-face flex flex-col gap-[20px] w-full px-[15px] pb-[25px]">
                {showBackButton && (
                    <div className="w-full">
                        <button
                            className="vc-card-back-button rounded-full h-[50px] px-[15px] flex items-center justify-center gap-[5px] z-50 text-[30px] text-white select-none"
                            onClick={showFrontFace}
                        >
                            <LeftArrow className="text-white" size="25" />
                            Details
                        </button>
                    </div>
                )}

                {customDescription && (
                    <TruncateTextBox
                        headerText="About"
                        text={description}
                        className="description-box"
                    >
                        {customDescription}
                    </TruncateTextBox>
                )}
                {!customDescription && (description || expiration) && (
                    <TruncateTextBox
                        headerText="About"
                        text={description}
                        className="description-box"
                    >
                        {expiration && (
                            <p className="text-grayscale-800 font-poppins font-[600] text-[12px] leading-[18px] mb-0">
                                Expire{isExpired ? 'd' : 's'} on {expiration}
                            </p>
                        )}
                    </TruncateTextBox>
                )}

                {customCriteria && (
                    <TruncateTextBox
                        headerText="Criteria"
                        text={description}
                        className="description-box"
                    >
                        {customCriteria}
                    </TruncateTextBox>
                )}
                {!customCriteria && criteria && (
                    <TruncateTextBox
                        headerText="Criteria"
                        text={criteria}
                        className="criteria-box"
                    />
                )}
                {(credential.skills?.length ?? 0) > 0 &&
                    (customSkillsComponent ?? <SkillsBox skills={credential.skills ?? []} />)}

                {issueHistory && issueHistory?.length > 0 && (
                    <IssueHistoryBox
                        issueHistory={issueHistory}
                        customIssueHistoryComponent={customIssueHistoryComponent}
                    />
                )}

                {credential.attachments && credential.attachments.length > 0 && (
                    <MediaAttachmentsBox
                        attachments={credential.attachments}
                        getFileMetadata={getFileMetadata}
                        getVideoMetadata={getVideoMetadata}
                        onMediaAttachmentClick={onMediaAttachmentClick}
                        enableLightbox={enableLightbox}
                    />
                )}
                {/* {credential.notes && <TruncateTextBox headerText="Notes" text={credential.notes} />} */}

                {alignment && <AlignmentsBox alignment={alignment} style="boost" />}

                {verificationItems && verificationItems.length > 0 && (
                    <VerificationsBox verificationItems={verificationItems} />
                )}
            </section>
        </Flipped>
    );
};

export default VC2BackFace;
