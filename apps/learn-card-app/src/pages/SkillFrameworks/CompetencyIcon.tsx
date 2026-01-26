import React from 'react';

type CompetencyIconProps = {
    icon: string;
    size?: 'normal' | 'big' | 'super-big';
};

const CompetencyIcon: React.FC<CompetencyIconProps> = ({ icon, size = 'normal' }) => {
    let sizeClassName = 'text-[30px] h-[35px] w-[35px] leading-[35px]';
    if (size === 'big') {
        sizeClassName = 'text-[40px] h-[45px] w-[45px] leading-[45px]';
    }
    if (size === 'super-big') {
        sizeClassName = 'text-[80px] h-[90px] w-[90px] leading-[90px]';
    }

    return (
        <span
            className={`font-fluentEmoji cursor-none pointer-events-none select-none ${sizeClassName}`}
        >
            {icon}
        </span>
    );
};

export default CompetencyIcon;
