import React from 'react';
import HexagonIcon from './HexagonIcon';
import ScoutsGlobeIcon from './ScoutsGlobeIcon';

interface ContactsIconProps {
    width?: number;
    height?: number;
    className?: string;
}

const ContactsIcon: React.FC<ContactsIconProps> = ({ width = 74, height = 84, className = '' }) => {
    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="relative" style={{ width, height }}>
                <HexagonIcon
                    className="absolute inset-0"
                    fill="#82E6DE"
                    width={width}
                    height={height}
                />
                <ScoutsGlobeIcon className="absolute inset-x-0 top-1/2 w-[70px] h-[70px] mx-auto transform -translate-y-1/3" />
            </div>
        </div>
    );
};

export default ContactsIcon;
