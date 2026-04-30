import React from 'react';

const LaunchPadHeaderCurvedDivider: React.FC = () => {
    return (
        <div className="relative w-full h-12 -mt-4 z-0">
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-white" />
            <div className="absolute -bottom-12 left-[-5%] right-[-5%] h-24 rounded-t-[100%] shadow-[0_-4px_4px_rgba(0,0,0,0.10)] bg-grayscale-100" />
        </div>
    );
};

export default LaunchPadHeaderCurvedDivider;
