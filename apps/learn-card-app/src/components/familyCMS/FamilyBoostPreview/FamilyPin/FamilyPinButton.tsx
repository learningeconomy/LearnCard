import React from 'react';

import SlimCaretRight from '../../../svgs/SlimCaretRight';
import { ProfilePicture } from 'learn-card-base';

export const FamilyPinButton: React.FC<{
    className?: string;
    title?: string;
    pinExists?: boolean;
    onClick?: () => void;
}> = ({ className, title, pinExists, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-between w-full mb-2 border-solid border-b-[2px] pb-4 border-grayscale-100 ${className}`}
        >
            <div className="flex">
                <span className="mr-3 min-h-[40px] min-w-[40px] flex items-center justify-center">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[40px] w-[40px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[40px] min-h-[40px]"
                        customImageClass="flex justify-center items-center h-[40px] w-[40px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[40px] min-h-[40px]"
                        customSize={120}
                    />
                </span>
                <p className="flex items-center text-grayscale-900 font-poppins text-xl">
                    {title}{' '}
                </p>
            </div>
            <div className="flex items-center justify-center text-grayscale-600 font-poppins text-sm">
                {pinExists && <span className="mt-1">*****</span>}

                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </div>
        </button>
    );
};

export default FamilyPinButton;
