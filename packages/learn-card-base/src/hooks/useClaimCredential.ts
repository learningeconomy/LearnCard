import React, { useState } from 'react';
import useWallet from './useWallet';
import { useIonAlert, useIonToast } from '@ionic/react';
import { useAcceptCredentialMutation } from 'learn-card-base/react-query/mutations/mutations';

export const useClaimCredential = (
    uri: string,
    options?: {
        successCallback?: () => Promise<void>;
        dismiss?: () => void;
        isClaimedInitialState?: boolean;
    }
) => {
    const { successCallback, dismiss, isClaimedInitialState } = options ?? {};

    const [isClaiming, setIsClaiming] = useState(false);
    const [isClaimed, setIsClaimed] = useState(isClaimedInitialState ?? false);
    const { mutate, isLoading: acceptCredentialLoading } = useAcceptCredentialMutation();
    const { addVCtoWallet } = useWallet();

    const [presentAlert, dismissAlert] = useIonAlert();
    const [presentToast] = useIonToast();

    const handleClaimCredential = async () => {
        if (!acceptCredentialLoading && !isClaiming && !isClaimed) {
            setIsClaiming(true);
            try {
                mutate(
                    { uri },
                    {
                        async onSuccess(data, variables, context) {
                            await addVCtoWallet({ uri });

                            setIsClaimed(true);
                            presentToast({
                                message: `Successfully claimed Credential!`,
                                duration: 3000,
                                cssClass: 'toast-custom-class ion-toast-bottom-nav-offset',
                            });

                            setIsClaiming(false);
                            await successCallback?.();
                            dismiss?.();
                        },
                    }
                );
            } catch (err) {
                console.log('acceptCredential::error', err?.message);
                presentAlert({
                    backdropDismiss: false,
                    cssClass: 'boost-confirmation-alert',
                    header: `There was an error: ${err?.message}`,
                    buttons: [
                        {
                            text: 'Okay',
                            role: 'cancel',
                            handler: () => {
                                dismissAlert();
                            },
                        },
                    ],
                });
                setIsClaiming(false);
            }
        }
    };

    return { handleClaimCredential, isClaiming, isClaimed };
};

export default useClaimCredential;
