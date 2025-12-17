import React from 'react';

type CompetencyIconProps = {
    icon: string;
};

const CompetencyIcon: React.FC<CompetencyIconProps> = ({ icon }) => {
    return (
        <span className="text-[30px] h-[35px] w-[35px] leading-[35px] font-fluentEmoji cursor-none pointer-events-none select-none">
            {icon}
        </span>
    );
};

export default CompetencyIcon;
