import React from 'react';

type TierIconProps = {
    icon: string;
};

const TierIcon: React.FC<TierIconProps> = ({ icon }) => {
    return (
        <div className="bg-grayscale-900 p-[5px] rounded-full shrink-0 h-[50px] w-[50px] flex items-center justify-center">
            <span className="text-[30px] h-[40px] w-[40px] leading-[40px] font-fluentEmoji cursor-none pointer-events-none select-none">
                {icon}
            </span>
        </div>
    );
};

export default TierIcon;
