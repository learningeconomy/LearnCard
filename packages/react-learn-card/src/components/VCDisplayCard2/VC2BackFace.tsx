import React from 'react';
import { format } from 'date-fns';

import VerificationRow from './VerificationRow';
import DownRightArrow from '../svgs/DownRightArrow';

import { VC, AchievementCredential, VerificationItem, Profile } from '@learncard/types';

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
};

const VC2BackFace: React.FC<VC2BackFaceProps> = ({
    credential,
    verificationItems,
    convertTagsToSkills = defaultTagsToSkills,
}) => {
    // TODO real expiration (if present)
    const expiration = format(new Date(), 'MMM dd, yyyy');
    const criteria = credential.credentialSubject.achievement?.criteria?.narrative;

    const tags = credential.credentialSubject.achievement.tag;
    const skillsObject = tags && tags.length > 0 ? convertTagsToSkills(tags) : undefined;

    return (
        <section className="flex flex-col gap-[20px] w-full px-[15px]">
            <h2 className="text-white text-[30px] pl-[10px]">Details</h2>
            <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                <h3 className="text-[20px] leading-[20px]">Description</h3>

                {/* TODO truncate if too long */}
                <p className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400] mb-0">
                    {credential.credentialSubject.achievement?.description}
                </p>

                {expiration && (
                    <p className="text-grayscale-800 font-poppins font-[600] text-[12px] leading-[18px] mb-0">
                        Expires on {expiration}
                    </p>
                )}
            </div>
            {criteria && (
                <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                    <h3 className="text-[20px] leading-[20px]">Criteria</h3>

                    {/* TODO truncate if too long */}
                    <p className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400]">
                        {criteria}
                    </p>
                </div>
            )}
            {tags && tags.length > 0 && (
                <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                    <h3 className="text-[20px] leading-[20px]">Skills</h3>
                    {Object.keys(skillsObject).map((skill, index) => {
                        const subskills = skillsObject[skill];
                        return (
                            <div
                                key={index}
                                className="p-[10px] bg-[#9B51E0]/[.15] w-full rounded-[15px] text-grayscale-900 flex flex-col gap-[5px]"
                            >
                                <div className="flex items-center py-[5px]">
                                    <span className="text-[20px] leading-[18px] tracking-[0.75px]">
                                        {skill}
                                    </span>
                                    <span className="bg-white rounded-full ml-auto h-[20px] w-[20px] flex items-center justify-center">
                                        +1
                                    </span>
                                </div>
                                {subskills.length > 0 &&
                                    subskills.map((subskill: string, index: number) => (
                                        <div
                                            key={`subskill-${index}`}
                                            className="flex items-center py-[5px]"
                                        >
                                            <DownRightArrow className="bg-white rounded-full h-[20px] w-[20px] px-[2.5px] py-[4px] overflow-visible mr-[10px]" />
                                            <span className="text-[17px] leading-[18px] tracking-[0.75px]">
                                                {subskill}
                                            </span>
                                            <span className="bg-white rounded-full ml-auto h-[20px] w-[20px] flex items-center justify-center">
                                                +1
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                <h3 className="text-[20px] leading-[20px]">Credential Verifications</h3>

                {verificationItems.map((verification, index) => (
                    <VerificationRow key={index} verification={verification} />
                ))}
            </div>
        </section>
    );
};

export default VC2BackFace;
