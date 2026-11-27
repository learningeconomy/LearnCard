import React, { useState } from 'react';
import { TrustedAppRegistryEntry, useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { getLogger } from '../../logging/logger';
import { AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
const log = getLogger('trusted-app-request-modal');

type TrustedAppRequestModalProps = {
    appInfo: TrustedAppRegistryEntry;
    challenge: string;
    handleCloseModal?: () => void;
    onSuccess?: () => void;
};

export const TrustedAppRequestModal: React.FC<TrustedAppRequestModalProps> = ({
    appInfo,
    challenge,
    handleCloseModal,
    onSuccess,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const brandingConfig = useBrandingConfig();

    const [loading, setLoading] = useState<boolean>(false);

    const appProfileId = appInfo?.profileId?.toLowerCase();

    const handleApproveConnection = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        const wallet = await initWallet();
        setLoading(true);

        try {
            await wallet?.invoke?.connectWithInvite(appProfileId, challenge);
            setLoading(false);
            onSuccess?.();
        } catch (err) {
            presentToast(
                err?.message ?? `An error ocurred, failed to connect to ${appInfo.app.name}.`,
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
            // @ts-ignore
            log.debug('connectionReq::error', err?.message);
            setLoading(false);
        }
    };

    return (
        <AppPage className="bg-white py-[30px]">
            <AppHeader className="ion-no-border">
                <AppToolbar color="#fffff">
                    <AppRow className="flex flex-col pb-4">
                        <AppCol className="w-full flex items-center justify-center">
                            <h6 className="tracking-[12px] text-base font-bold text-black">
                                {brandingConfig?.name}
                            </h6>
                        </AppCol>
                    </AppRow>
                </AppToolbar>
            </AppHeader>
            <AppGrid>
                <AppRow className="flex items-center justify-center w-full">
                    <div className="flex flex-col items-center justify-center">
                        <div className="rounded-lg shadow-3xl overflow-hidden w-[60px] h-[60px] mr-3 min-w-[60px] min-h-[60px]">
                            <img
                                className="w-full h-full object-cover"
                                src={appInfo.app.icon}
                                alt={appInfo.app.name}
                            />
                            <br />
                        </div>
                        <div className="mt-4 mb-4">
                            <h1 className="text-grayscale-900 font-mouse text-4xl">
                                {appInfo.app.name}
                            </h1>
                        </div>
                    </div>
                </AppRow>
                <AppRow className="flex items-center justify-center w-full">
                    <AppCol className="text-center">
                        <p className="text-center text-sm font-semibold px-[16px] text-grayscale-800">
                            An application is requesting access to credentials stored in your
                            {brandingConfig?.name}.
                        </p>
                        <br />

                        <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                            <span className="font-semibold text-grayscale-800">
                                Requesting access to:
                            </span>
                            <br />
                            View your profile photo and name, view and access credentials you select
                            to share, and send credentials to you.
                        </p>

                        <br />
                        {/* <button
                                className="text-indigo-500 font-bold"
                            >
                                Edit Access
                            </button> */}
                    </AppCol>
                </AppRow>
                <AppRow className="w-full flex items-center justify-center mt-6">
                    <AppCol className="flex items-center flex-col max-w-[90%] border-b border-grayscale-200">
                        <button
                            type="submit"
                            onClick={handleApproveConnection}
                            className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 font-mouse text-3xl w-full shadow-lg uppercase max-w-[320px]"
                        >
                            {!loading && 'Accept'}
                            {loading && 'Connecting...'}
                        </button>

                        <div className="w-full flex items-center justify-center m-4">
                            <button
                                onClick={() => {
                                    handleCloseModal?.();
                                }}
                                className="text-grayscale-900 text-center text-base w-full font-medium"
                            >
                                Don't Accept
                            </button>
                        </div>
                    </AppCol>
                </AppRow>
                <AppRow className="flex items-center justify-center mt-4">
                    <AppCol className="flex flex-col items-center justify-center text-center">
                        <p className="text-center text-sm font-normal px-16 text-grayscale-600">
                            You own your own data.
                            <br />
                            All connections are encrypted.
                        </p>
                        <button className="text-indigo-500 font-bold">Learn More</button>
                    </AppCol>
                </AppRow>
                <AppRow className="flex items-center justify-center">
                    <AppCol className="flex items-center justify-center">
                        <button className="text-indigo-500 font-bold text-sm">
                            Privacy Policy
                        </button>
                        <span className="text-indigo-500 font-bold text-sm">&nbsp;•&nbsp;</span>
                        <button className="text-indigo-500 font-bold text-sm">
                            Terms of Service
                        </button>
                    </AppCol>
                </AppRow>
            </AppGrid>
        </AppPage>
    );
};

export default TrustedAppRequestModal;
