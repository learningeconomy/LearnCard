import React from 'react';

import AddUser from '../svgs/AddUser';

export const NewProfileButton: React.FC<{ label: string; onClick?: () => void }> = ({
    label,
    onClick,
}) => {
    return (
        <div className="flex flex-col items-center">
            <button
                onClick={onClick}
                aria-label={label}
                className="h-[86px] w-[86px] rounded-full overflow-hidden bg-emerald-50 flex items-center justify-center"
            >
                <AddUser version="4" />
            </button>
            <p className="text-xs text-grayscale-600 text-center font-semibold mt-1">{label}</p>
        </div>
    );
};

export default NewProfileButton;
