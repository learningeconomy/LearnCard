import React from 'react';

import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import * as m from '../../paraglide/messages.js';

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
    return (
        <header
            className={`shrink-0 px-6 py-5 border-b border-grayscale-200 bg-white font-poppins ${className ?? ''}`}
        >
            <div className="flex items-center justify-normal gap-3">
                <div className="h-11 w-11 shrink-0">
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

                <div className="flex min-w-0 flex-col gap-1 items-start justify-center">
                    <p className="text-base font-semibold text-grayscale-900 leading-snug break-words">
                        {name}
                    </p>
                    <p className="text-xs text-grayscale-600 font-medium">
                        {m['consentFlow.privacyAndData']()}
                    </p>
                </div>
            </div>
        </header>
    );
};

export default PrivacyAndDataHeader;
