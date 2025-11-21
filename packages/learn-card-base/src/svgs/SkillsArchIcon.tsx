import React from 'react';

export const SkillsArchIcon: React.FC<{ className?: string; fill?: string }> = ({
    className = '',
    fill = 'white',
}) => {
    return (
        <svg
            width="68"
            height="109"
            viewBox="0 0 68 109"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path d="M67.2137 108.297V18.6L34.0012 0L0.785156 18.6V108.297H67.2137Z" fill={fill} />
        </svg>
    );
};

export default SkillsArchIcon;
