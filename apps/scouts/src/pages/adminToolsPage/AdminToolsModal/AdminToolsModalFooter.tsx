import React from 'react';

import { IonFooter } from '@ionic/react';

import { useModal } from 'learn-card-base';

const AdminToolsModalFooter: React.FC<{
    isDisabled?: boolean;
    onSave?: () => void;
    className?: string;
    showSaveButton?: boolean;
    isLoading?: boolean;
    footerTextOverride?: string;
}> = ({ isDisabled, onSave, className, showSaveButton, isLoading, footerTextOverride }) => {
    const { closeModal } = useModal();

    return (
        <IonFooter
            mode="ios"
            className={`w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 left-0 bg-white !max-h-[100px] ${className}`}
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    <button
                        onClick={closeModal}
                        className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                    >
                        {footerTextOverride || 'Close'}
                    </button>
                    {showSaveButton && (
                        <button
                            onClick={onSave}
                            disabled={isDisabled}
                            className={`py-[7px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center mr-2 ${
                                isDisabled ? 'bg-grayscale-300' : 'bg-emerald-700'
                            }`}
                        >
                            {isLoading ? 'Loading...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>
        </IonFooter>
    );
};

export default AdminToolsModalFooter;
