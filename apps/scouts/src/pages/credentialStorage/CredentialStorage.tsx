import React, { useState, useEffect } from 'react';
import { CredentialStoreEvent } from '@learncard/chapi-plugin';
import type { VP, VC } from '@learncard/types';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import { useCurrentUser, chapiStore, redirectStore } from 'learn-card-base';
import {
    getCredentialName,
    getImageUrlFromCredential,
    getDetailsFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import useWallet from 'learn-card-base/hooks/useWallet';
import { IonPage, IonContent } from '@ionic/react';
import CredentialStorageFooter from './CredentialStorageFooter';
import LoadingPage from '../loadingPage/LoadingPage';
import { useAddCredentialToWallet } from '../../components/boost/mutations';

export const getCredentialFromVp = (vp: VP): VC => {
    const vcField = vp.verifiableCredential;

    return Array.isArray(vcField) ? vcField[0] : vcField;
};

const CredentialStorage: React.FC = () => {
    const { initWallet, publishEncryptedContentToCeramic } = useWallet();
    const currentUser = useCurrentUser();
    const { mutate: addCredentialToWallet } = useAddCredentialToWallet();
    const [event, setEvent] = useState<CredentialStoreEvent>();
    const [title, setTitle] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [lcDid, setLcDid] = useState<any>();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.privateKey) {
                console.warn('🤔 Current user still loading...');
                return;
            }

            const wallet = await initWallet();
            const walletDid = wallet?.id.did();
            setLcDid(walletDid);

            const _event = await wallet.invoke.receiveChapiEvent();

            if ('credential' in _event) setEvent(_event);
        };
        fetchData();
    }, [currentUser]);

    if (!event) return <LoadingPage />;

    const accept = async () => {
        setIsLoading(true);
        const wallet = await initWallet();
        const uri = await publishEncryptedContentToCeramic(credential);

        const imgUrl = getImageUrlFromCredential(credential);
        const credTitle = title && title?.trim() !== '' ? title : getCredentialName(credential);

        const payload = {
            title: credTitle,
            uri,
            imgUrl,
        };

        await addCredentialToWallet({ ...payload });

        try {
            chapiStore.set.isChapiInteraction(null);
            redirectStore.set.authRedirect(null);
        } catch (e) {
            console.error(e);
        }

        event.respondWith(
            Promise.resolve({
                dataType: 'VerifiablePresentation',
                data: presentation,
            })
        );
        setIsLoading(false);
    };

    const reject = () => {
        try {
            chapiStore.set.isChapiInteraction(null);
            redirectStore.set.authRedirect(null);
        } catch (e) {
            console.error(e);
        }
        event.respondWith(Promise.resolve(null));
    };

    const presentation = event.credential.data;

    const credential = presentation && getCredentialFromVp(presentation);
    const imgUrl = getImageUrlFromCredential(credential);
    const credTitle = title && title?.trim() !== '' ? title : getCredentialName(credential);

    const credentialStorageFooterProps = {
        title,
        setTitle,
        accept,
        reject,
        isLoading,
    };

    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="pb-[50px]">
                    <VCDisplayCardWrapper2
                        overrideCardImageUrl={imgUrl}
                        overrideCardTitle={credTitle}
                        credential={credential}
                        className="credential-storage-vc-card"
                        walletDid={lcDid}
                    />
                    <CredentialStorageFooter
                        className="ion-no-border mt-5 credential-storage-footer-desktop"
                        {...credentialStorageFooterProps}
                    />
                </div>
            </IonContent>
            <CredentialStorageFooter
                className="credential-storage-footer-mobile"
                {...credentialStorageFooterProps}
            />
        </IonPage>
    );
};

export default CredentialStorage;
