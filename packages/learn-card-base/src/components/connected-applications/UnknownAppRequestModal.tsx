import React, { useState } from 'react';
import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import TRex from '../../assets/images/emptystate-dinocandle.png';
import { getLogger } from '../../logging/logger';
import { AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
const log = getLogger('unknown-app-request-modal');

type UnknownAppRequestModalProps = {
    appProfileId: string;
    challenge: string;
    handleCloseModal?: () => void;
    onSuccess?: () => void;
};

export const UnknownAppRequestModal: React.FC<UnknownAppRequestModalProps> = ({
    appProfileId,
    challenge,
    handleCloseModal,
    onSuccess,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const brandingConfig = useBrandingConfig();

    const [loading, setLoading] = useState<boolean>(false);

    const handleApproveConnection = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        const wallet = await initWallet();
        setLoading(true);

        const justTesting = false; // TODO
        if (justTesting) {
            setLoading(false);
            onSuccess?.();
            return;
        }

        try {
            await wallet?.invoke?.connectWithInvite(appProfileId, challenge);
            setLoading(false);
            onSuccess?.();
        } catch (err) {
            presentToast(err?.message ?? 'An error ocurred, failed to connect to Application.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            // @ts-ignore
            log.debug('connectionReq::error', err?.message);
            setLoading(false);
        }
    };

    return (
        <AppPage className="bg-rose-600 text-white pt-[30px] pb-[20px]">
            <AppHeader className="ion-no-border">
                <AppToolbar color="#fffff">
                    <AppRow className="flex flex-col pb-4">
                        <AppCol className="w-full flex items-center justify-center">
                            <h6 className="tracking-[12px] font-bold">{brandingConfig?.name}</h6>
                        </AppCol>
                    </AppRow>
                </AppToolbar>
            </AppHeader>
            <AppGrid>
                <AppRow className="flex items-center justify-center w-full">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-[140px] h-[140px]">
                            <img
                                className="w-full h-full object-cover"
                                src={TRex}
                                alt="Candle T-Rex"
                            />
                            <br />
                        </div>
                        <div className="mt-4 mb-4">
                            <h1 className="font-mouse text-4xl">Unknown App Request</h1>
                        </div>
                    </div>
                </AppRow>
                <AppRow className="flex items-center justify-center w-full">
                    <AppCol className="text-center font-poppins px-[16px]">
                        <p className="text-[16px] font-medium leading-[24px]">
                            An unknown application wants to connect with you.
                        </p>
                        <br />

                        <p className="text-[14px] leading-[21px]">
                            <span className="font-bold">Requesting access to:</span>
                            <br />
                            <span className="font-normal">
                                View your profile photo and name, view and access credentials you
                                select to share, and send credentials to you.
                            </span>
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
                            onClick={handleCloseModal}
                            className="flex items-center justify-center text-rose-600 rounded-full px-[18px] py-[12px] bg-white font-mouse text-3xl w-full shadow-bottom uppercase max-w-[320px]"
                        >
                            Don't Accept
                        </button>

                        <div className="w-full flex items-center justify-center m-4">
                            <button
                                onClick={handleApproveConnection}
                                className="text-center font-[600] text-[17px] leading-[26px] font-poppins w-full font-medium"
                            >
                                {!loading && 'Continue Anyway'}
                                {loading && 'Connecting...'}
                            </button>
                        </div>
                    </AppCol>
                </AppRow>
                <AppRow className="flex items-center justify-center mt-4">
                    <AppCol className="flex flex-col items-center justify-center text-center">
                        <p className="text-center text-sm font-normal px-16">
                            You own your own data.
                            <br />
                            All connections are encrypted.
                        </p>
                        <button className="font-bold">Learn More</button>
                    </AppCol>
                </AppRow>
                <AppRow className="flex items-center justify-center">
                    <AppCol className="flex items-center justify-center">
                        <button className="font-bold text-sm">Privacy Policy</button>
                        <span className="font-bold text-sm">&nbsp;•&nbsp;</span>
                        <button className="font-bold text-sm">Terms of Service</button>
                    </AppCol>
                </AppRow>
            </AppGrid>
        </AppPage>
    );
};

export default UnknownAppRequestModal;
