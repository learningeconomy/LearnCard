import React from 'react';

import SkillsIcon from 'learn-card-base/svgs/wallet/SkillsIcon';

const TotalSkillsCount: React.FC<{ total: number }> = ({ total }) => {
    return (
        <div className="w-full flex items-center justify-between my-4">
            <h4 className="text-[20px] font-poppins text-grayscale-900 font-semibold">Skills</h4>
            <div className="rounded-full bg-white py-1 px-4 flex items-center text-violet-800 border-solid border-[1px] border-violet-300">
                <SkillsIcon className="h-[30px] w-[30px] mr-1" fill="#6D28D9" />
                {total}
            </div>
        </div>
    );
};

export default TotalSkillsCount;
