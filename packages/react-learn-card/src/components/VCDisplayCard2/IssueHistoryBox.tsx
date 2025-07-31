import React from 'react';

import UserProfilePicture from '../UserProfilePicture/UserProfilePicture';
import { IssueHistory } from '../../types';

type SkillsBoxProps = {
    issueHistory: IssueHistory[];
    customIssueHistoryComponent?: React.ReactNode;
};

const IssueHistoryBox: React.FC<SkillsBoxProps> = ({
    issueHistory,
    customIssueHistoryComponent,
}) => {
    let renderIssueHistory = issueHistory?.map(issueItem => {
        return (
            <div
                className="flex items-center issue-log-item border-b-[1px] last:border-b-0 py-[5px] border-grayscale-200 border-solid w-full"
                key={issueItem?.id}
            >
                <div className="profile-thumb-img vc-issuee-image h-[35px] w-[35px] rounded-full overflow-hidden">
                    <UserProfilePicture
                        customContainerClass={`h-full w-full object-cover select-none text-xl ${
                            !issueItem?.thumb ? 'pt-[2px]' : ''
                        }`}
                        user={{ image: issueItem?.thumb, name: issueItem?.name }}
                        alt="profile"
                    />
                </div>
                <div className="ml-[9px] flex flex-col justify-center">
                    <p className="issue-item-name font-montserrat font-semibold text-grayscale-900 text-[14px] ">
                        {issueItem?.name}
                    </p>
                    <p className="issue-item-date font-montserrat  text-[12px] text-grayscale-600 ">
                        {issueItem?.date}
                    </p>
                </div>
            </div>
        );
    });

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full relative">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">Issue Log</h3>
            {!customIssueHistoryComponent ? renderIssueHistory : customIssueHistoryComponent}
        </div>
    );
};

export default IssueHistoryBox;
