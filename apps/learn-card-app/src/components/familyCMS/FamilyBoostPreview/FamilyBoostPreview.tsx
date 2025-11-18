import React, { useState } from 'react';

import { IonContent, IonPage, useIonModal } from '@ionic/react';
import FamilyBoostFooter from './FamilyBoostFooter/FamilyBoostFooter';
import FamilyBoostPreviewFrontFace from './FamilyBoostPreviewFrontFace';
import FamilyBoostPreviewBackFace from './FamilyBoostPreviewBackFace';
import ShareBoostLink from '../../boost/boost-options-menu/ShareBoostLink';
import FamilyInviteGuardian from './FamilyBoostInviteModal/FamilyInviteGuardian';

import { VC } from '@learncard/types';
import { ModalTypes, useModal } from 'learn-card-base';
import { BoostCategoryOptionsEnum } from '../../boost/boost-options/boostOptions';

export const FamilyPreview: React.FC<{
    credential: VC;
    boostUri?: string;
    handleCloseModal: () => void;
}> = ({ credential, boostUri, handleCloseModal }) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const [isFront, setIsFront] = useState<boolean>(true);

    const backgroundImage = credential?.display?.backgroundImage;
    const backgroundColor = credential?.display?.backgroundColor || '#353E64';
    const fadeBackgroundImage = credential?.display?.fadeBackgroundImage || false;
    const repeatBackgroundImage = credential?.display?.repeatBackgroundImage || false;

    const presentShareBoostLink = () => {
        const shareBoostLinkModalProps = {
            handleClose: () => closeModal(),
            boost: credential,
            boostUri: boostUri,
            categoryType: BoostCategoryOptionsEnum.family,
        };

        newModal(<ShareBoostLink {...shareBoostLinkModalProps} />);
    };

    const [openInviteModal, dismissInviteModal] = useIonModal(FamilyInviteGuardian, {
        boostUri: credential?.boostId,
        credential: credential,
        handleCloseModal: () => dismissInviteModal(),
    });

    let backgroundStyles = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#353E64',
    };

    if (fadeBackgroundImage) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${backgroundImage})`,
        };

        if (backgroundColor) {
            backgroundStyles = {
                ...backgroundStyles,
                backgroundImage: `linear-gradient(${backgroundColor}80, ${backgroundColor}80), url(${backgroundImage})`,
            };
        }
    }

    if (repeatBackgroundImage) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
        };
    }

    if (!fadeBackgroundImage) {
        backgroundStyles.backgroundColor = backgroundColor;
    }

    return (
        <IonPage>
            <IonContent fullscreen color="grayscale-800">
                <div
                    className="w-full flex flex-col items-center justify-start ion-padding overflow-y-scroll h-full"
                    style={{
                        ...backgroundStyles,
                    }}
                >
                    {isFront ? (
                        <FamilyBoostPreviewFrontFace
                            credential={credential}
                            presentShareBoostLink={presentShareBoostLink}
                        />
                    ) : (
                        <FamilyBoostPreviewBackFace credential={credential} />
                    )}
                </div>
            </IonContent>
            <FamilyBoostFooter
                credential={credential}
                boostUri={boostUri}
                isFront={isFront}
                setIsFront={setIsFront}
                handleCloseModal={handleCloseModal}
                handleShareBoostLink={presentShareBoostLink}
                handleInviteModal={openInviteModal}
            />
        </IonPage>
    );
};

export default FamilyPreview;
