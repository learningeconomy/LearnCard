import React, { useState, useEffect } from 'react';
import { CredentialStoreEvent } from '@learncard/chapi-plugin';
import { UnsignedVPValidator, VP, VC } from '@learncard/types';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import { useCurrentUser, chapiStore, redirectStore } from 'learn-card-base';
import {
    getCredentialName,
    getImageUrlFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import useWallet from 'learn-card-base/hooks/useWallet';
import { IonPage, IonContent } from '@ionic/react';
import CredentialStorageFooter from './CredentialStorageFooter';
import LoadingPage from '../loadingPage/LoadingPage';
import {
    getExchangeUrlFromExchangeRequest,
    isInteractExchangeRequest,
    isVcApiProtocolExchangeRequest,
} from '../../helpers/chapi.helpers';

export const getCredentialFromVp = (vp: VP): VC => {
    const vcField = vp.verifiableCredential;

    return Array.isArray(vcField) ? vcField[0] : vcField;
};

const CredentialExchange: React.FC = () => {
    const { addVCtoWallet, initWallet, publishEncryptedContentToCeramic } = useWallet();
    const currentUser = useCurrentUser();

    const [event, setEvent] = useState<CredentialStoreEvent>();
    const [credential, setCredential] = useState<VC | undefined>(undefined);
    const [title, setTitle] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [lcDid, setLcDid] = useState<any>();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.privateKey) {
                console.warn('🤔 Current user still loading...');
                return;
            }

            console.log('Current user found ✅.');

            const wallet = await initWallet();
            setLcDid(wallet.id.did());

            const _event = await wallet.invoke.receiveChapiEvent();

            if ('credential' in _event) {
                setEvent(_event);

                const presentation = _event.credential.data;

                if (isVcApiProtocolExchangeRequest(_event)) {
                    const didAuthRes = await fetch(getExchangeUrlFromExchangeRequest(_event), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: '{}',
                    });

                    let presentation = await didAuthRes.json();

                    if ('verifiablePresentationRequest' in presentation) {
                        const vpr = presentation.verifiablePresentationRequest;

                        const vp = await wallet.invoke.getDidAuthVp({
                            domain: vpr.domain,
                            challenge: vpr.challenge,
                            proofPurpose: 'authentication',
                            verificationMethod: await wallet.invoke.didToVerificationMethod(
                                wallet.id.did('key')
                            ),
                        });

                        const res = await fetch(getExchangeUrlFromExchangeRequest(_event), {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ verifiablePresentation: vp }),
                        });

                        presentation = await res.json();
                    }

                    const isVpResult = await UnsignedVPValidator.spa(
                        presentation?.verifiablePresentation
                    );

                    if (isVpResult.success) {
                        setCredential(
                            Array.isArray(isVpResult.data.verifiableCredential)
                                ? isVpResult.data.verifiableCredential[0]
                                : isVpResult.data.verifiableCredential
                        );
                    } else {
                        setCredential(Array.isArray(presentation?.verifiablePresentation?.verifiableCredential)
                            ? presentation?.verifiablePresentation?.verifiableCredential[0]
                            : presentation?.verifiablePresentation?.verifiableCredential);
                    }

                    return;
                }

                if (isInteractExchangeRequest(_event)) {
                    const didAuthVp = {
                        '@context': [
                            'https://www.w3.org/ns/credentials/v2',
                            'https://w3id.org/security/suites/ed25519-2020/v1',
                        ],
                        type: ['VerifiablePresentation'],
                        holder: wallet.id.did('key'), // Have to use did:key for now
                    };

                    const vp = await wallet.invoke.issuePresentation(didAuthVp, {
                        domain: presentation.domain,
                        challenge: presentation.challenge,
                        proofPurpose: 'authentication',
                        verificationMethod: await wallet.invoke.didToVerificationMethod(
                            wallet.id.did('key')
                        ),
                    });

                    const res = await fetch(getExchangeUrlFromExchangeRequest(_event), {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify(vp),
                    });

                    const parsedResult = await res.json();

                    setCredential(parsedResult);
                }
            }
        };
        fetchData();
    }, [currentUser]);

    if (!event || !credential) return <LoadingPage />;

    const imgUrl = getImageUrlFromCredential(credential);
    const credTitle = title && title?.trim() !== '' ? title : getCredentialName(credential);

    const accept = async () => {
        setIsLoading(true);
        const wallet = await initWallet();
        const uri = await publishEncryptedContentToCeramic(credential);

        const payload = { title: credTitle, uri, imgUrl };

        await addVCtoWallet(payload);

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

export default CredentialExchange;
