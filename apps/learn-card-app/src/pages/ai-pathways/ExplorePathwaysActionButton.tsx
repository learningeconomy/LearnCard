import React from 'react';

type ExplorePathwaysActionButtonProps = {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    className?: string;
};

const ExplorePathwaysActionButton: React.FC<ExplorePathwaysActionButtonProps> = ({
    label,
    icon,
    onClick,
    className = '',
}) => {
    return (
        <button
            onClick={onClick}
            className={`w-full text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px] ${className}`}
        >
            {icon}
            {label}
        </button>
    );
};

export default ExplorePathwaysActionButton;
