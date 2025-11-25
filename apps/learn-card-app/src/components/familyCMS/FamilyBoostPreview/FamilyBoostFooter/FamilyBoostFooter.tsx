import React from 'react';

import { IonFooter, IonToolbar } from '@ionic/react';
import X from '../../../svgs/X';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import FamilyActionMenu from '../../FamilyActionMenu/FamilyActionMenu';

import { ModalTypes, useModal } from 'learn-card-base';
import { VC } from '@learncard/types';

export const FamilyBoostFooter: React.FC<{
    credential: VC;
    boostUri?: string;
    isFront?: boolean;
    setIsFront?: React.Dispatch<React.SetStateAction<boolean>>;
    handleShareBoostLink: () => void;
    handleInviteModal: () => void;
    handleCloseModal: () => void;
}> = ({
    credential,
    boostUri,
    isFront,
    setIsFront,
    handleShareBoostLink,
    handleInviteModal,
    handleCloseModal,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px]"
        >
            <IonToolbar color="transparent" mode="ios">
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] pb-0 px-4 pt-2">
                        <button
                            onClick={handleCloseModal}
                            className="min-w-[46px] min-h-[46px] bg-white rounded-full flex items-center justify-center mr-2 shadow-soft-bottom"
                        >
                            <X className="w-[20px] h-auto text-grayscale-900" />
                        </button>
                        {isFront ? (
                            <button
                                onClick={() => setIsFront?.(!isFront)}
                                className="bg-white font-poppins text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                            >
                                Details
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsFront?.(!isFront)}
                                className="bg-white font-poppins text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                            >
                                Back
                            </button>
                        )}

                        <button
                            onClick={handleShareBoostLink}
                            className="text-white font-poppins text-lg font-semibold rounded-full py-[12px] w-full bg-grayscale-900 mr-2 flex items-center justify-center"
                        >
                            Share <ReplyIcon className="ml-1" />
                        </button>
                        <button
                            onClick={() => {
                                newModal(
                                    <FamilyActionMenu
                                        credential={credential}
                                        boostUri={boostUri}
                                        handleInviteModal={handleInviteModal}
                                        handleShareBoostLink={handleShareBoostLink}
                                    />
                                );
                            }}
                            className="min-w-[46px] min-h-[46px] bg-white rounded-full flex items-center justify-center mr-2 shadow-soft-bottom"
                        >
                            <ThreeDots className="w-[20px] h-auto text-grayscale-900" />
                        </button>
                    </div>
                </div>
            </IonToolbar>
        </IonFooter>
    );
};

export default FamilyBoostFooter;
