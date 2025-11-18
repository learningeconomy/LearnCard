import React from 'react';
import DiamondIcon from './DiamondIcon';
import ScoutsAlertsIcon from './ScoutsAlertsIcon';

interface AlertsIconProps {
    unreadCount?: number;
    width?: number;
    height?: number;
    className?: string;
}

const AlertsIcon: React.FC<AlertsIconProps> = ({
    unreadCount = 0,
    width = 74,
    height = 84,
    className = '',
}) => {
    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="relative" style={{ width, height }}>
                <DiamondIcon
                    className="absolute inset-0"
                    fill="#FF8DFF"
                    width={width}
                    height={height}
                />
                <ScoutsAlertsIcon className="absolute inset-x-0 top-1/2 w-[60px] h-[60px] mx-auto transform -translate-y-1/3" />
                {unreadCount > 0 && (
                    <div className="absolute top-0 right-0 translate-y-[8px] translate-x-[8px] flex flex-col justify-center items-center w-[31px] h-[24px] bg-white rounded-[20px] shadow-[0_3px_0_0_rgba(0,0,0,0.25)]">
                        <div className="text-[#FF5655] font-notosans text-[14px] leading-normal">
                            {unreadCount}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertsIcon;
