import React from 'react';

type MenuLeftIconProps = {
    className?: string;
};

const MenuLeftIcon: React.FC<MenuLeftIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path d="M5 8.75H25" stroke="#353E64" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 21.25H20" stroke="#353E64" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
};

export default MenuLeftIcon;
