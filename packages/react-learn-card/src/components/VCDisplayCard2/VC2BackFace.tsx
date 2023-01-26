import React from 'react';
import { format } from 'date-fns';

import MediaAttachmentsBox, { MediaMetadata } from './MediaAttachmentsBox';
import TruncateTextBox from './TruncateTextBox';
import SkillsBox from './SkillsBox';

import { MediaAttachment } from '../../helpers/test.helpers';
import { VC, AchievementCredential, VerificationItem } from '@learncard/types';
import VerificationsBox from './VerificationsBox';

const defaultTagsToSkills = (tags: string[]) => {
    const skillsObj: { [skill: string]: string[] } = {};
    tags.forEach(tag => {
        skillsObj[tag] = [];
    });
};

type VC2BackFaceProps = {
    credential: VC | AchievementCredential;
    verificationItems: VerificationItem[];
    convertTagsToSkills?: (tags: string[]) => { [skill: string]: string[] };
    getFileMetadata?: (url: string) => MediaMetadata;

    // dunno where these live yet within a VC, so I'll just rewire it later
    extraFields?: { notes?: string; mediaAttachments?: MediaAttachment[]; expiration: Date };
};

const VC2BackFace: React.FC<VC2BackFaceProps> = ({
    credential,
    verificationItems,
    convertTagsToSkills = defaultTagsToSkills,
    getFileMetadata,
    extraFields,
}) => {
    // TODO real expiration (if present)
    const expiration = format(new Date(), 'MMM dd, yyyy');
    const criteria = credential.credentialSubject.achievement?.criteria?.narrative;

    const tags = credential.credentialSubject.achievement?.tag;
    const skillsObject = tags && tags.length > 0 ? convertTagsToSkills(tags) : undefined;

    return (
        <section className="flex flex-col gap-[20px] w-full px-[15px]">
            <TruncateTextBox
                headerText="Description"
                text={credential.credentialSubject.achievement?.description}
            >
                {expiration && (
                    <p className="text-grayscale-800 font-poppins font-[600] text-[12px] leading-[18px] mb-0">
                        Expires on {expiration}
                    </p>
                )}
            </TruncateTextBox>
            {criteria && <TruncateTextBox headerText="Criteria" text={criteria} />}
            {skillsObject && <SkillsBox skillsObject={skillsObject} />}
            {extraFields?.mediaAttachments && extraFields.mediaAttachments.length > 0 && (
                <MediaAttachmentsBox
                    attachments={extraFields?.mediaAttachments}
                    getFileMetadata={getFileMetadata}
                />
            )}
            {extraFields?.notes && <TruncateTextBox headerText="Notes" text={extraFields?.notes} />}

            <VerificationsBox verificationItems={verificationItems} />
        </section>
    );
};

export default VC2BackFace;
