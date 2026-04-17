import React from 'react';

type AiPathwayCareerSectionProps = {
    title: string;
    compact?: boolean;
    children: React.ReactNode;
};

const AiPathwayCareerSection: React.FC<AiPathwayCareerSectionProps> = ({
    title,
    compact = false,
    children,
}) => {
    if (compact) {
        return (
            <div className="w-full flex flex-col gap-3">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-[17px] text-grayscale-900 font-poppins font-bold leading-[24px]">
                        {title}
                    </h2>
                </div>
                {children}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">{title}</h2>
            </div>
            {children}
        </div>
    );
};

export default AiPathwayCareerSection;
