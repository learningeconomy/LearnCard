import React from 'react';

const LaunchPadHeaderCurvedDivider: React.FC = () => {
    return (
        <div className="relative w-full h-24 -mt-8 z-0">
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-white" />
            <div className="absolute -bottom-24 left-[-5%] right-[-5%] h-48 rounded-t-[100%] shadow-[0_-4px_4px_rgba(0,0,0,0.10)] bg-grayscale-100" />
        </div>
    );
};

export default LaunchPadHeaderCurvedDivider;
