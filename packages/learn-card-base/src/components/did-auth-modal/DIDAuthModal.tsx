import React, { useState } from 'react';
import { Link, useHistory, useParams, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { useDIDAuthPresentation } from './useDIDAuthPresentation';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import { sanitizeImageUrl } from '@learncard/helpers';
import VCDisplayCardWrapper from '../vcmodal/VCDisplayCardWrapper';

import useWallet from 'learn-card-base/hooks/useWallet';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import redirectStore from 'learn-card-base/stores/redirectStore';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppButton } from 'learn-card-base/ui/controls/AppButton';
import { AppButtons } from 'learn-card-base/ui/controls/AppButtons';
import { AppCol } from 'learn-card-base/ui/layout';
import {
    AppCard,
    AppCardContent,
    AppCardHeader,
    AppCardSubtitle,
    AppCardTitle,
} from 'learn-card-base/ui/widgets';

export const DIDAuthModal = () => {
    const { challenge } = useParams<{ challenge: string }>();
    const { search } = useLocation();
    const parsedDomain = queryString.parse(search).domain;
    const domain = typeof parsedDomain === 'string' ? parsedDomain : undefined;

    const history = useHistory();
    const [authInitiated, setAuthInitiated] = useState(false);

    const [verificationCode, setVerificationCode] = useState<string>();
    const [authVPLoading, setAuthVPLoading] = useState(false);

    const [copied, setCopied] = useState(false);

    const { issueDIDAuthPresentation, publishContentToCeramic } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const vp = useDIDAuthPresentation(challenge, domain, issueDIDAuthPresentation);

    const handleInititateAuth = async () => {
        setAuthVPLoading(true);

        const streamId = await publishContentToCeramic(vp);

        setAuthVPLoading(false);
        setAuthInitiated(true);
        setVerificationCode(streamId);
    };

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
        <AppPage>
            <div className="modal-wrapper overflow-y-auto">
                <AppHeader className="ion-no-border transparent">
                    <AppToolbar className="qr-code-user-card-toolbar ion-no-border transparent">
                        <AppButtons slot="start">
                            <Link to="/wallet">
                                <AppButton className="text-grayscale-600">
                                    <LeftArrow className="w-10 h-auto text-grayscale-600" />
                                </AppButton>
                            </Link>
                        </AppButtons>
                    </AppToolbar>
                </AppHeader>

                <section>
                    <AppCol size="12" className="flex justify-center items-center w-full mt-4">
                        {displayVerificationCode && (
                            <DIDAuthMessage
                                title={'Verification Code'}
                                subtitle={
                                    'Copy and paste this verification code in the app you are verifying your identity with.'
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
                    </AppCol>
                    <div className="hidden md:block">
                        {displayVC && !authInitiated && (
                            <VCDisplayCardWrapper credential={displayVC} />
                        )}
                    </div>
                    <AppCol size="12" className="flex justify-center items-center w-full mt-4">
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
                    </AppCol>
                </section>
            </div>
        </AppPage>
    );
};

export const DIDAuthMessage = ({ title, subtitle, text, color, image }) => {
    const safeImageUrl = sanitizeImageUrl(image);
    return (
        <AppCard color={color} style={{ maxWidth: '600px ' }}>
            {safeImageUrl && <img alt="Success" src={safeImageUrl} />}
            <AppCardHeader>
                <AppCardTitle>{title}</AppCardTitle>
                <AppCardSubtitle>{subtitle}</AppCardSubtitle>
            </AppCardHeader>

            <AppCardContent>{text}</AppCardContent>
        </AppCard>
    );
};

export default DIDAuthModal;
