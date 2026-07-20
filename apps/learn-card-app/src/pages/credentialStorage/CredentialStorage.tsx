import React, { useState, useEffect } from 'react';
import { CredentialStoreEvent } from '@learncard/chapi-plugin';
import type { VP, VC } from '@learncard/types';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import {
    useCurrentUser,
    chapiStore,
    redirectStore,
    CredentialCategory,
    CredentialCategoryEnum,
    categoryMetadata,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { getLogger } from 'learn-card-base';
const log = getLogger('credential-storage');

import {
    getCredentialName,
    getImageUrlFromCredential,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import useWallet from 'learn-card-base/hooks/useWallet';
import { IonPage, IonContent, IonRow, IonCol, IonGrid, IonLoading } from '@ionic/react';

import CredentialStorageFooter from './CredentialStorageFooter';
import LoadingPage from '../loadingPage/LoadingPage';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import * as m from '../../paraglide/messages.js';

export const getCredentialFromVp = (vp: VP): VC => {
    const vcField = vp.verifiableCredential;

    return (Array.isArray(vcField) ? vcField[0] : vcField) as VC;
};

export const areMultipleCredentials = (vp: VP): boolean => {
    const vcField = vp.verifiableCredential;

    return Array.isArray(vcField) && vcField.length > 1;
};

const SingleCredential: React.FC<{
    presentation: VP;
    accept: () => void;
    reject: () => void;
    isLoading: boolean;
    lcDid: string;
}> = ({ presentation, accept, reject, isLoading, lcDid }) => {
    const [title, setTitle] = useState<string>('');

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
                <div className="pb-[50px] pt-[50px]">
                    <div className="credential-storage-vc-card">
                        <VCDisplayCardWrapper2
                            overrideCardImageUrl={imgUrl}
                            overrideCardTitle={credTitle}
                            credential={credential!}
                            walletDid={lcDid}
                        />
                    </div>
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

const MultiCredential: React.FC<{
    presentation: VP;
    accept: () => void;
    reject: () => void;
    isLoading: boolean;
    claimCount: number;
    totalToClaim: number;
    lcDid: string;
}> = ({ presentation, accept, reject, isLoading, claimCount, totalToClaim, lcDid }) => {
    const [title, setTitle] = useState<string>('');

    const credential = presentation && getCredentialFromVp(presentation);

    const credentials = presentation.verifiableCredential.map((cred: VC) => {
        const category: CredentialCategory =
            cred?.category ||
            getDefaultCategoryForCredential(cred) ||
            CredentialCategoryEnum.achievement;
        const categoryImgUrl = categoryMetadata[category].defaultImageSrc;
        return (
            <BoostEarnedCard
                credential={cred}
                defaultImg={categoryImgUrl}
                categoryType={category}
            />
        );
    });
    const imgUrl = getImageUrlFromCredential(credential);
    const credTitle = title && title?.trim() !== '' ? title : getCredentialName(credential);

    const credentialStorageFooterProps = {
        title,
        setTitle,
        accept,
        reject,
        isLoading,
        claimCount,
        totalToClaim,
    };
    return (
        <IonPage>
            <IonContent fullscreen>
                <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                    <IonGrid className="max-w-[600px]">
                        <IonRow>{credentials}</IonRow>
                    </IonGrid>
                </IonCol>
                <div className="pb-[50px] pt-[50px]">
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

const CredentialStorage: React.FC = () => {
    const { addVCtoWallet, initWallet, publishEncryptedContentToCeramic } = useWallet();
    const currentUser = useCurrentUser();

    const [event, setEvent] = useState<CredentialStoreEvent>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [lcDid, setLcDid] = useState<any>();
    const [claimCount, setClaimCount] = useState(0);
    const [totalToClaim, setTotalToClaim] = useState(0);
    const { presentToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.privateKey) {
                log.warn('🤔 Current user still loading...');
                return;
            }

            log.info('Current user found ✅.');

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
        try {
            setIsLoading(true);
            setClaimCount(0);
            const wallet = await initWallet();

            if (!presentation?.verifiableCredential) return;
            const credentialsToAccept = Array.isArray(presentation.verifiableCredential)
                ? presentation.verifiableCredential
                : [presentation.verifiableCredential];

            setTotalToClaim(credentialsToAccept.length);
            for (let x = 0; x < credentialsToAccept.length; x++) {
                const accepting = credentialsToAccept[x];
                if (!accepting) continue;
                const uri = await publishEncryptedContentToCeramic(accepting);

                const imgUrl = getImageUrlFromCredential(accepting);
                const credTitle = getCredentialName(accepting);

                const payload = {
                    title: credTitle,
                    uri,
                    imgUrl,
                };
                log.info(
                    `Adding VC to LearnCard (${x + 1}/${credentialsToAccept.length})`,
                    payload
                );

                await addVCtoWallet(payload);
                setClaimCount(x + 1);
            }

            try {
                chapiStore.set.isChapiInteraction(null);
                redirectStore.set.authRedirect(null);
            } catch (e) {
                log.error('failed to clear chapi/redirect stores', e);
            }

            event.respondWith(
                Promise.resolve({
                    dataType: 'VerifiablePresentation',
                    data: presentation,
                })
            );
            setIsLoading(false);
            setClaimCount(totalToClaim);
        } catch (e) {
            log.error(e);
            presentToast(m['toasts.acceptFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            setIsLoading(false);
            setClaimCount(0);
        }
    };

    const reject = () => {
        try {
            chapiStore.set.isChapiInteraction(null);
            redirectStore.set.authRedirect(null);
        } catch (e) {
            log.error(e);
            presentToast(m['toasts.rejectFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
        event.respondWith(Promise.resolve(null));
    };

    const presentation = event.credential.data;

    if (areMultipleCredentials(presentation)) {
        return (
            <>
                <IonLoading mode="ios" message={'Claiming...'} isOpen={isLoading} />
                <MultiCredential
                    presentation={presentation}
                    accept={accept}
                    reject={reject}
                    lcDid={lcDid}
                    isLoading={isLoading}
                    claimCount={claimCount}
                    totalToClaim={totalToClaim}
                />
            </>
        );
    }
    return (
        <>
            <IonLoading mode="ios" message={'Claiming...'} isOpen={isLoading} />
            <SingleCredential
                presentation={presentation}
                accept={accept}
                reject={reject}
                lcDid={lcDid}
                isLoading={isLoading}
            />
        </>
    );
};

export default CredentialStorage;
