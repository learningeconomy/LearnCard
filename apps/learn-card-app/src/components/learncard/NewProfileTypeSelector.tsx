import React from 'react';

import AddUser from '../svgs/AddUser';

export const NewProfileTypeSelector: React.FC<{
    handleGoBack: () => void;
    handleCreateChildAccount: () => void;
    handleCreateOrganizationAccount: () => void;
}> = ({ handleGoBack, handleCreateChildAccount, handleCreateOrganizationAccount }) => {
    return (
        <>
            <div className="flex flex-col items-center ion-padding bg-white rounded-[20px]">
                <h4 className="text-[20px] text-grayscale-900 py-4">Select a Profile Type</h4>

                <button
                    onClick={handleCreateChildAccount}
                    className="text-left text-lg flex items-start justify-start gap-2 text-grayscale-800 w-full py-4 px-2"
                >
                    <AddUser version="2" className="mr-1 text-grayscale-800" fill="#E2E3E9" />
                    Child Profile
                </button>
                <button
                    onClick={handleCreateOrganizationAccount}
                    className="text-left text-lg flex items-start justify-start gap-2 text-grayscale-800 w-full py-4 px-2"
                >
                    <AddUser version="2" className="mr-1 text-grayscale-800" fill="#E2E3E9" />
                    Organization Profile
                </button>
            </div>

            <div className="w-full flex items-center justify-center mt-4">
                <button
                    type="button"
                    className="shrink-0 w-full py-2 h-full flex items-center font-medium justify-center text-xl bg-white rounded-[20px] shadow-bottom text-grayscale-800"
                    onClick={handleGoBack}
                >
                    Back
                </button>
            </div>
        </>
    );
};

export default NewProfileTypeSelector;
