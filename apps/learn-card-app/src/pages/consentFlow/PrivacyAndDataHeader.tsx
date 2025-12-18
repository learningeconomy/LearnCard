import React from 'react';

import EmptyImage from 'learn-card-base/assets/images/empty-image.png';

interface PrivacyAndDataHeaderProps {
    name: string;
    image: string;
    className?: string;
}

export const PrivacyAndDataHeader: React.FC<PrivacyAndDataHeaderProps> = ({
    name,
    image,
    className,
}) => {
    // TODO properly handle mobile top padding
    return (
        <header className={`p-[20px] shadow-header safe-area-top-margin ${className}`}>
            <div className="flex items-center justify-normal gap-[10px]">
                <div className="h-[65px] w-[65px]">
                    {image ? (
                        <img
                            className="w-full h-full object-cover bg-white rounded-[16px] overflow-hidden border-[1px] border-solid border-grayscale-200"
                            alt={`${name} logo`}
                            src={image}
                        />
                    ) : (
                        <img
                            src={EmptyImage}
                            alt="Contract Icon"
                            className="h-full w-full object-contain p-2 rounded-[16px] overflow-hidden border-[1px] border-solid border-grayscale-200"
                        />
                    )}
                </div>

                <div className="flex flex-col gap-[2px] items-start justify-center">
                    <p className="text-[22px] font-poppins font-[600] text-grayscale-900 leading-[24px]">
                        {name}
                    </p>
                    <p className="text-[17px] text-grayscale-900 font-notoSans font-[600] leading-[24px] tracking-[0.25px]">
                        Privacy & Data
                    </p>
                </div>
            </div>
        </header>
    );
};

export default PrivacyAndDataHeader;
