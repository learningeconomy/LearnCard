import React from 'react';

import { IonFooter, IonToolbar, useIonModal } from '@ionic/react';
import X from '../svgs/X';
import LearnCardIDPreview from './LearnCardIDPreview';

import { FamilyChildAccount, FamilyCMSAppearance } from '../familyCMS/familyCMSState';
import { ModalTypes, useModal } from 'learn-card-base';

export const LearnCardIDCMSFooter: React.FC<{
    user: FamilyChildAccount;
    learnCardID: FamilyCMSAppearance;
    handleSave: () => void;
    handleCloseModal: () => void;
}> = ({ user, learnCardID, handleSave, handleCloseModal }) => {
    const { newModal, closeModal } = useModal();

    let actionButtonColor = 'bg-grayscale-900';

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] absolute bottom-0 bg-white max-h-[100px]"
        >
            <IonToolbar color="transparent" mode="ios">
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                        <button
                            onClick={handleCloseModal}
                            className="rounded-full bg-white shadow-soft-bottom min-h-[52px] min-w-[52px] flex items-center justify-center mr-2"
                        >
                            <X className="h-auto w-[20px] text-grayscale-900" />
                        </button>
                        <button
                            onClick={() =>
                                newModal(
                                    <LearnCardIDPreview
                                        handleCloseModal={() => closeModal()}
                                        learnCardID={learnCardID}
                                        user={user}
                                    />,
                                    {},
                                    {
                                        desktop: ModalTypes.FullScreen,
                                        mobile: ModalTypes.FullScreen,
                                    }
                                )
                            }
                            className="bg-white text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                        >
                            Preview
                        </button>
                        <button
                            onClick={handleSave}
                            className={`text-white text-lg font-bold rounded-full py-[12px] w-full ${actionButtonColor}`}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </IonToolbar>
        </IonFooter>
    );
};

export default LearnCardIDCMSFooter;
