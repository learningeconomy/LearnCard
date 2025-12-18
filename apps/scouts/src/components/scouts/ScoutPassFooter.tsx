import React from 'react';
import { ModalTypes, useModal } from 'learn-card-base';
import { IonFooter } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import ShareModal from '../share/ShareModal';
import { useIonModal } from '@ionic/react';
import { useCheckIfUserInNetwork } from '../network-prompts/hooks/useCheckIfUserInNetwork';

type ScoutPassFooterProps = {
    hideShare?: boolean;
    buttonText?: string;
    icon?: any;
    buttonAction?: () => void;
};

const ScoutPassFooter: React.FC<ScoutPassFooterProps> = ({
    hideShare = false,
    buttonText = 'Share',
    icon,
    buttonAction,
}) => {
    const { newModal, closeModal } = useModal();
    const checkIfUserInNetwork = useCheckIfUserInNetwork();

    const handleShare = () => {
        if (!checkIfUserInNetwork()) return;

        newModal(
            <ShareModal handleCloseModal={closeModal} />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px]"
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    {hideShare ? (
                        <button
                            onClick={closeModal}
                            className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center"
                        >
                            Close
                        </button>
                    ) : (
                        <button
                            onClick={closeModal}
                            className="min-w-[46px] min-h-[46px] bg-white rounded-full flex items-center justify-center mr-2 shadow-soft-bottom"
                        >
                            <X className="w-[20px] h-auto text-grayscale-900" />
                        </button>
                    )}

                    {!hideShare && (
                        <button
                            onClick={buttonText === 'Share' ? () => handleShare() : buttonAction}
                            className="bg-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center"
                        >
                            {buttonText}
                            {icon}
                        </button>
                    )}
                </div>
            </div>
        </IonFooter>
    );
};

export default ScoutPassFooter;
