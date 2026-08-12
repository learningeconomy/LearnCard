// Landing page for the account-level guardian approval link
// (`/interactions/guardian-approval/:token`), emailed by the brain-service
// `sendGuardianApprovalEmail` flow (LC-1001). Distinct from the credential-scoped
// GuardianCredentialApprovalPage (LC-1729): this one consumes the token and marks the
// requesting user's *profile* as approved (EU parental consent / minor account approval).
//
// The link possession is the approval factor (matching the backend GET-by-path design),
// so we consume the token on load and show the result — no OTP step.

import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useParams } from 'react-router-dom';

import { initLearnCard } from '@learncard/init';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { getResolvedTenantConfig, getTenantHeaders } from '../../config/bootstrapTenantConfig';
import { useTenantBrandingAssets } from '../../config/brandingAssets';
import { useTheme } from '../../theme/hooks/useTheme';

type PageState = 'loading' | 'approved' | 'error';

type LCNOpenInvoke = {
    approveGuardianRequest: (token: string) => Promise<{ message: string }>;
};

const toErrorMessage = (err: unknown): string =>
    err instanceof Error
        ? err.message
        : 'Something went wrong. The approval link may be invalid or expired.';

const getNetworkUrl = (): string => {
    const config = getResolvedTenantConfig();
    return config.apis?.brainService ?? 'https://network.learncard.com/trpc';
};

const GuardianAccountApprovalPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();

    const { textLogo, brandMarkLight } = useTenantBrandingAssets();
    const { brandName } = useBrandingConfig();
    const { theme } = useTheme();
    const bgColor =
        theme.colors.defaults.loginBgColor ?? theme.colors.defaults.loaders?.[0] ?? '#059669';

    const [state, setState] = useState<PageState>('loading');
    const [error, setError] = useState<string>('');
    const [resultMessage, setResultMessage] = useState<string>('');

    // Guard against the effect running twice (React StrictMode) consuming the token twice.
    const startedRef = useRef<boolean>(false);

    useEffect(() => {
        if (!token) {
            setError('Missing approval token.');
            setState('error');
            return;
        }

        if (startedRef.current) return;
        startedRef.current = true;

        const approve = async () => {
            try {
                const wallet = await initLearnCard({
                    seed: 'a',
                    network: getNetworkUrl(),
                    didkit,
                    allowRemoteContexts: true,
                    extraHeaders: getTenantHeaders(),
                });
                const invoke = wallet.invoke as unknown as LCNOpenInvoke;

                const res = await invoke.approveGuardianRequest(token);
                setResultMessage(res?.message ?? 'The account has been approved.');
                setState('approved');
            } catch (e: unknown) {
                setError(toErrorMessage(e));
                setState('error');
            }
        };

        approve();
    }, [token]);

    return (
        <IonPage>
            <IonContent
                fullscreen
                className="flex flex-col flex-grow"
                style={{ ['--background' as any]: bgColor }}
            >
                <div
                    className="h-full w-full flex flex-col items-center justify-center px-6 text-center text-white"
                    style={{ backgroundColor: bgColor }}
                >
                    <a
                        href="/login"
                        className="flex flex-col items-center justify-center w-full mb-8"
                    >
                        <img
                            src={brandMarkLight}
                            alt={`${brandName} brand mark`}
                            className="w-[64px] h-[64px] mb-3"
                        />
                        <img src={textLogo} alt={`${brandName} text logo`} className="h-4" />
                    </a>

                    {state === 'loading' && (
                        <div className="flex flex-col items-center gap-3">
                            <IonSpinner color="light" />
                            <p className="font-semibold text-lg">Confirming approval…</p>
                        </div>
                    )}

                    {state === 'approved' && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Account Approved</h1>
                            <p className="text-white/80 max-w-[520px] mb-6">
                                {resultMessage ||
                                    'The account has been approved. They can now finish setting up their account.'}
                            </p>
                            <a
                                href="/login"
                                className="text-white font-semibold underline underline-offset-2 text-sm"
                            >
                                Go to {brandName} →
                            </a>
                        </>
                    )}

                    {state === 'error' && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
                            <p className="text-white/80 max-w-[520px] mb-4">{error}</p>
                        </>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default GuardianAccountApprovalPage;
