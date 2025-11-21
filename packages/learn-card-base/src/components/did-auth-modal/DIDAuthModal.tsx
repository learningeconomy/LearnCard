import React, { useState, useEffect } from 'react';
import { Link, useHistory, useParams, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import {
    IonPage,
    IonHeader,
    IonButton,
    IonToolbar,
    IonButtons,
    IonCol,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
} from '@ionic/react';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import VCDisplayCardWrapper from '../vcmodal/VCDisplayCardWrapper';

import useWallet from 'learn-card-base/hooks/useWallet';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import redirectStore from 'learn-card-base/stores/redirectStore';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';

export const DIDAuthModal = () => {
    const { challenge } = useParams<{ challenge: string }>();
    const { search } = useLocation();
    const { domain } = queryString.parse(search);


    const history = useHistory();
    const [authInitiated, setAuthInitiated] = useState(false);

    const [vp, setVP] = useState<any>();
    const [verificationCode, setVerificationCode] = useState<string>();
    const [authVPLoading, setAuthVPLoading] = useState(false);

    const [copied, setCopied] = useState(false);

    const { issueDIDAuthPresentation, publishContentToCeramic } = useWallet();
    const isLoggedIn = useIsLoggedIn();

    const handleInititateAuth = async () => {
        setAuthVPLoading(true);

        const streamId = await publishContentToCeramic(vp);

        setAuthVPLoading(false);
        setAuthInitiated(true);
        setVerificationCode(streamId);
    };

    const handleCreateVP = async () => {
        const vp = await issueDIDAuthPresentation(challenge, domain);
        setVP(vp);
    };

    useEffect(() => {
        if (challenge && !vp) {
            handleCreateVP();
        }
    }, [challenge, vp]);

    const dismiss = async ({ historyPush }) => {
        history.push(historyPush ?? '/wallet');
    };
    const handleDismiss = async ({ redirectToLogin, redirectToLoginRememberParams }) => {
        if (redirectToLogin) {
            await dismiss({ historyPush: '/login' });
            return;
        }
        if (redirectToLoginRememberParams) {
            await dismiss({
                historyPush: `/login?redirectTo=/did-auth/${challenge}?domain=${domain}`,
            });
            redirectStore.set.authRedirect(`/did-auth/${challenge}?domain=${domain}`);
            return;
        }
    };

    const displayVC = vp?.verifiableCredential
        ? {
            ...vp.verifiableCredential,
            credentialSubject: {
                id: domain,
                achievement: {
                    name: `DID Auth`,
                    description: 'DID Verification Request.',
                    image: 'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/JYHtMu1wTZuNv1j5T6xh',
                    criteria: { narrative: 'You agree to share your DID address.' },
                },
            },
        }
        : null;

    const displayVerificationCode = verificationCode
        ? verificationCode.replace('lc:ceramic:', '')
        : '';

    return (
        <IonPage>
            <div className="modal-wrapper overflow-y-auto">
                <IonHeader className="ion-no-border transparent">
                    <IonToolbar className="qr-code-user-card-toolbar ion-no-border transparent">
                        <IonButtons slot="start">
                            <Link to="/wallet">
                                <IonButton className="text-grayscale-600">
                                    <LeftArrow className="w-10 h-auto text-grayscale-600" />
                                </IonButton>
                            </Link>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <section>
                    <IonCol size="12" className="flex justify-center items-center w-full mt-4">
                        {displayVerificationCode && (
                            <DIDAuthMessage
                                title={'Verification Code'}
                                subtitle={
                                    'Copy and paste this verification code in the app you are verifying your identity with, e.g. run the /finish-connect-id command if interacting with the Discord bot.'
                                }
                                text={`${displayVerificationCode}`}
                                image={
                                    'https://cdn.filestackcontent.com/rotate=deg:exif/output=format:webp/sF2b9VUOQWCMvaE20Hx2'
                                }
                            />
                        )}
                        {!displayVerificationCode && (
                            <DIDAuthMessage
                                title={'DID Identity Verification'}
                                subtitle={''}
                                text={`${domain} would like to verify your DID identity.`}
                            />
                        )}
                    </IonCol>
                    <div className="hidden md:block">
                        {displayVC && !authInitiated && (
                            <VCDisplayCardWrapper credential={displayVC} />
                        )}
                    </div>
                    <IonCol size="12" className="flex justify-center items-center w-full mt-4">
                        {isLoggedIn && !authInitiated && (
                            <>
                                <button
                                    onClick={handleInititateAuth}
                                    className="w-[40%] flex items-center justify-center bg-grayscale-900 text-white  py-3 mr-3 font-bold text-lg rounded-[40px] shadow-2xl"
                                >
                                    {authVPLoading ? 'Loading...' : 'Authorize DID Verification'}
                                </button>

                                <Link to="/wallet">
                                    <button className="w-[45px] h-[45px] lex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl text-black">
                                        X
                                    </button>
                                </Link>
                            </>
                        )}

                        {authInitiated && (
                            <>
                                <CopyToClipboard
                                    text={displayVerificationCode}
                                    onCopy={() => setCopied(true)}
                                >
                                    <button className="w-[40%] flex items-center justify-center bg-grayscale-900 text-white  py-3 mr-3 font-bold text-lg rounded-[40px] shadow-2xl">
                                        {copied ? 'Copied!' : 'Copy Code'}
                                    </button>
                                </CopyToClipboard>
                                <Link to="/wallet">
                                    <button className="w-[45px] h-[45px] lex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl text-black">
                                        X
                                    </button>
                                </Link>
                            </>
                        )}
                        {!isLoggedIn && (
                            <>
                                <button
                                    onClick={() => {
                                        handleDismiss({
                                            redirectToLogin: false,
                                            redirectToLoginRememberParams: true,
                                        });
                                    }}
                                    className="w-[70%] flex items-center justify-center bg-grayscale-900 text-white  py-3 mr-3 font-bold text-lg rounded-[40px] shadow-2xl max-w-[320px]"
                                >
                                    Login To Verify
                                </button>
                                <button
                                    onClick={() => {
                                        handleDismiss({
                                            redirectToLogin: true,
                                            redirectToLoginRememberParams: false,
                                        });
                                    }}
                                    className="w-[45px] h-[45px] lex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl text-black"
                                >
                                    X
                                </button>
                            </>
                        )}
                    </IonCol>
                </section>
            </div>
        </IonPage>
    );
};

export const DIDAuthMessage = ({ title, subtitle, text, color, image }) => {
    return (
        <IonCard color={color} style={{ maxWidth: '600px ' }}>
            {image && <img alt="Success" src={image} />}
            <IonCardHeader>
                <IonCardTitle>{title}</IonCardTitle>
                <IonCardSubtitle>{subtitle}</IonCardSubtitle>
            </IonCardHeader>

            <IonCardContent>{text}</IonCardContent>
        </IonCard>
    );
};

export default DIDAuthModal;
