import React from 'react';

import { IonFooter, IonToolbar } from '@ionic/react';
import { FamilyCMSEditorModeEnum } from '../familyCMSState';

export const FamilyCMSFooter: React.FC<{
    handleCreateFamily: () => void;
    handleEditFamily: () => void;
    handleCloseModal: () => void;
    editorMode?: FamilyCMSEditorModeEnum;
}> = ({ handleCreateFamily, handleEditFamily, handleCloseModal, editorMode }) => {
    const handleOnClick = () => {
        if (editorMode === FamilyCMSEditorModeEnum.edit) {
            handleEditFamily();
        } else {
            handleCreateFamily();
        }
    };

    const actionButtonText = editorMode === FamilyCMSEditorModeEnum.create ? 'Create' : 'Save';

    return (
        <>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px]"
            >
                <IonToolbar color="transparent" mode="ios">
                    <div className="w-full flex items-center justify-center">
                        <div className="w-full flex items-center justify-between max-w-[600px] pb-0 px-4 pt-2">
                            <button
                                onClick={handleCloseModal}
                                className="bg-white font-poppins text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOnClick}
                                className="text-white font-poppins text-lg font-semibold rounded-full py-[12px] w-full bg-emerald-700"
                            >
                                {actionButtonText}
                            </button>
                        </div>
                    </div>
                </IonToolbar>
            </IonFooter>
        </>
    );
};

export default FamilyCMSFooter;
