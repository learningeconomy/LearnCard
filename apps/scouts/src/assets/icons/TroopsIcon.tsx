import React from 'react';
import CircleIcon from './CircleIcon';
import ScoutsTroopIcon from './ScoutsTroopIcon';

interface TroopsIconProps {
    width?: number;
    height?: number;
    className?: string;
}

const TroopsIcon: React.FC<TroopsIconProps> = ({ width = 74, height = 84, className = '' }) => {
    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="relative" style={{ width, height }}>
                <CircleIcon
                    className="absolute inset-0"
                    fill="#9FED8F"
                    width={width}
                    height={height}
                />
                <ScoutsTroopIcon className="absolute inset-x-0 top-1/2 w-[70px] h-[70px] mx-auto transform -translate-y-1/4" />
            </div>
        </div>
    );
};

export default TroopsIcon;
