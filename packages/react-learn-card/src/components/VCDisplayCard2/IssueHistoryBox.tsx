import React, { useState } from 'react';

import DownRightArrow from '../svgs/DownRightArrow';
import InfoIcon from '../svgs/InfoIcon';
import InfoBox from './InfoBox';
import { IssueHistory } from '../../types';

type SkillsBoxProps = {
    issueHistory: IssueHistory[];
};

const IssueHistoryBox: React.FC<SkillsBoxProps> = ({ issueHistory }) => {
    const renderIssueHistory = issueHistory?.map(issueItem => {
        return <div>issue item</div>;
    });

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full relative">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">Skills</h3>
            {renderIssueHistory}
        </div>
    );
};

export default IssueHistoryBox;
