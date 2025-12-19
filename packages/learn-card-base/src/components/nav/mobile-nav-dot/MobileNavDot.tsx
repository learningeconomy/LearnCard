import React from 'react';

export const MobileNavDot: React.FC<{ className?: string }> = ({ className = '' }) => {
    return <span className={className}>•</span>;
};

export default MobileNavDot;
