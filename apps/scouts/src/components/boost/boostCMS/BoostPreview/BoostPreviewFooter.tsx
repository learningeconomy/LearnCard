import React from 'react';

import { IonSpinner } from '@ionic/react';

import { boostCategoryOptions } from '../../boost-options/boostOptions';

export const BoostPreviewFooter: React.FC<{
    selectedVCType: string;
    showSaveAndQuitButton?: boolean;
    isSaveLoading?: boolean;
    handleSaveAndQuit?: (goBack?: boolean) => {};
    showIssueButton?: boolean;
    handleSubmit?: () => void;
    isLoading?: boolean;
    isEditMode?: boolean
}> = ({
    selectedVCType,
    showSaveAndQuitButton = true,
    handleSaveAndQuit = () => {},
    isSaveLoading = false,
    handleSubmit = () => {},
    showIssueButton = false,
    isLoading = false,
    isEditMode = false
}) => {
    const { color, IconComponent } = boostCategoryOptions[selectedVCType];

    return (
        <div className="flex items-center justify-center w-full">
            {showSaveAndQuitButton && (
                <button
                    disabled={isSaveLoading}
                    onClick={() => handleSaveAndQuit?.(isEditMode ? true : false)}
                    className="flex flex-1 items-center justify-center bg-white rounded-full px-[18px] py-[8px] text-grayscale-900 text-xl shadow-lg mr-3 text-center"
                >
                    {isSaveLoading ? (
                        <>
                            <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />{' '}
                            <p className="w-full line-clamp-1 ">
                                Saving...
                            </p>
                        </>
                    ) : (
                        <p className="w-full line-clamp-1 font-medium">
                            Save
                        </p>
                    )}
                </button>
            )}
            {showIssueButton && (
                <button
                    disabled={isLoading}
                    onClick={() => {
                        handleSubmit?.();
                    }}
                    className="relative flex flex-1 items-center justify-center bg-white rounded-full px-[18px] py-[8px] text-grayscale-900 text-xl shadow-lg text-center text-ellipsis"
                >
                    <div
                        className={`flex z-50 items-center justify-center absolute h-[40px] w-[40px] left-1 rounded-full !bg-${color}`}
                    >
                        <IconComponent className={`h-[30px] text-white`} />
                    </div>
                    {isLoading ? (
                        <>
                            <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />{' '}
                            <p className="w-full line-clamp-1 font-medium">
                                Loading...
                            </p>
                        </>
                    ) : (
                        <p className="w-full line-clamp-1 font-medium ml-8">
                            Send
                        </p>
                    )}
                </button>
            )}
        </div>
    );
};

export default BoostPreviewFooter;
