import React from 'react';

import CollapseIcon from 'learn-card-base/svgs/CollapseIcon';
import { useDeviceTypeByWidth } from 'learn-card-base';

export const MediaCollapseButton: React.FC<{
    onClick: () => void;
}> = ({ onClick }) => {
    const { isMobile } = useDeviceTypeByWidth();

    if (!isMobile)
        return (
            <button
                className="fixed bottom-4 right-4 z-50 bg-white/50 rounded-full text-grayscale-900 p-2 shadow-button-bottom"
                onClick={onClick}
            >
                <CollapseIcon className="h-[30px] w-[30px] text-grayscale-800" />
            </button>
        );

    return (
        <div className="w-full flex items-center justify-end ion-padding">
            <div className="sticky h-[50px] w-[50px] z-[99999] bg-white/50 rounded-full text-grayscale-900 shadow-button-bottom flex items-center justify-end">
                <button
                    className="flex items-center justify-center w-full h-full"
                    onClick={onClick}
                >
                    <CollapseIcon className="h-[30px] w-[30px] text-grayscale-800" />
                </button>
            </div>
        </div>
    );
};

export default MediaCollapseButton;
