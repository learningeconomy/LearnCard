import React from 'react';

type CompetencyIconProps = {
    icon: string | undefined;
    size?: 'normal' | 'big' | 'super-big' | 'small' | 'x-small';
    withWhiteBackground?: boolean;
};

const CompetencyIcon: React.FC<CompetencyIconProps> = ({
    icon,
    size = 'normal',
    withWhiteBackground = false,
}) => {
    let sizeClassName = 'text-[30px] h-[35px] w-[35px] leading-[35px]';
    if (size === 'small') {
        sizeClassName = 'text-[16px] h-[24px] w-[24px] leading-[24px] pl-[1px]';
    }
    if (size === 'x-small') {
        sizeClassName = 'text-[14px] h-[20px] w-[20px] leading-[20px] pl-[1px]';
    }
    if (size === 'big') {
        sizeClassName = 'text-[40px] h-[45px] w-[45px] leading-[45px]';
    }
    if (size === 'super-big') {
        sizeClassName = 'text-[80px] h-[90px] w-[90px] leading-[90px] ml-[-15px]';
    }

    return (
        <span
            className={`font-fluentEmoji cursor-none pointer-events-none select-none ${
                withWhiteBackground ? 'bg-white rounded-full' : ''
            } ${sizeClassName}`}
        >
            {icon || '🧩'}
        </span>
    );
};

export default CompetencyIcon;
