import React, { useState } from 'react';
import DefaultFace from '../../assets/images/default-face.jpeg';

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
                className="flex items-center issue-log-item border-b-[1px] py-[5px] border-grayscale-200 border-solid w-full"
                key={issueItem?.id}
            >
                <div className="profile-thumb-img vc-issuee-image h-[35px] w-[35px] rounded-full overflow-hidden">
                    <img
                        className="h-full w-full object-cover"
                        src={issueItem?.thumb || DefaultFace}
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

    if (customIssueHistoryComponent) {
        renderIssueHistory = customIssueHistoryComponent;
    }

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full relative">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">Issue Log</h3>
            {renderIssueHistory}
        </div>
    );
};

export default IssueHistoryBox;
