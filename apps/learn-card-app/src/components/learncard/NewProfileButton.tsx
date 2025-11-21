import React from 'react';

import AddUser from '../svgs/AddUser';

export const NewProfileButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
    return (
        <div className="flex flex-col items-center">
            <button
                onClick={onClick}
                className="h-[86px] w-[86px] rounded-full overflow-hidden bg-emerald-50 flex items-center justify-center"
            >
                <AddUser version="4" />
            </button>
            <p className="text-xs text-grayscale-600 text-center font-semibold mt-1">
                New Child <br />
                or Organization
            </p>
        </div>
    );
};

export default NewProfileButton;
