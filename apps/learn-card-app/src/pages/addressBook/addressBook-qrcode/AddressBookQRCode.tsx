import React, { useState, useEffect } from 'react';
import * as m from '../../../paraglide/messages.js';
import { QRCodeSVG } from 'qrcode.react';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet, useToast, ToastTypeEnum, useDeviceTypeByWidth } from 'learn-card-base';

import { IonCol, IonRow, IonPage, IonSpinner } from '@ionic/react';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import ModalLayout from 'apps/learn-card-app/src/layout/ModalLayout';
import { getAppBaseUrl } from 'apps/learn-card-app/src/config/bootstrapTenantConfig';

import { shareOrCopy } from '../../../helpers/shareHelpers';

const AddressBookQRCode: React.FC<{
    handleCloseModal: () => void;
}> = ({ handleCloseModal }) => {
    const currentUser = useCurrentUser();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { isMobile } = useDeviceTypeByWidth();

    const [walletDid, setWalletDid] = useState<string>('');

    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) getWalletDid();
    }, [walletDid]);

    /*
      This is a connection *request* link, deliberately — the recipient acts on
      it. It is NOT the unlimited-use auto-connect invite from `useInviteLink`:
      this modal is also mounted from the Boost CMS issue flow
      (BoostAddressBookContactOptions), where minting a 30-day auto-connect
      invite just to show a QR would be the wrong trust model. The bug fixed
      here was only the hardcoded `pass.scout.org` host; the semantics are
      unchanged.
    */
    const connectUrl = walletDid ? `${getAppBaseUrl()}/connect?connect=true&did=${walletDid}` : '';

    const handleShare = async () => {
        if (!connectUrl) return;

        // Desktop copies rather than opening the macOS share sheet — see
        // InviteLinkModal for why feature detection alone is not enough.
        const result = await shareOrCopy({
            url: connectUrl,
            title: m['contacts.addContactDesc'](),
            allowWebShare: isMobile,
        });

        if (result.method === 'clipboard') {
            presentToast(m['contacts.invite.linkCopied'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        }
    };

    return (
        <IonPage>
            <ModalLayout handleOnClick={handleCloseModal} allowScroll>
                <div className="flex w-full flex-col items-center justify-center">
                    <div className="flex flex-col w-full items-center justify-center">
                        <h1 className={`m-0 p-0 text-[32px] font-poppins`}>Add Contact</h1>
                        <p className="m-0 p-0">Have your contact scan this code.</p>
                    </div>
                </div>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="w-full flex items-center justify-center">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl"
                            customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2"
                            customSize={500}
                        />
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="w-full flex items-center justify-center">
                        <p className="text-grayscale-900 text-xl font-medium">
                            {currentUser?.name || currentUser?.email}
                        </p>
                    </IonCol>
                </IonRow>
                <div className="flex justify-center items-center w-full relative px-10 mb-5 mt-5">
                    <div className="max-w-[90%] w-full h-auto relative user-qr-code-modal-qr-wrap">
                        {connectUrl ? (
                            <QRCodeSVG
                                className="h-full w-full"
                                value={connectUrl}
                                data-testid="qrcode-card"
                                bgColor="transparent"
                            />
                        ) : (
                            // Never render a QR for the empty string — it scans
                            // fine and leads nowhere.
                            <div className="flex items-center justify-center py-10">
                                <IonSpinner color="black" />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-center w-full mt-3">
                    <div className="flex items-center justify-center w-full px-5">
                        <h2 className="divider-with-text">
                            <span>or</span>
                        </h2>
                    </div>
                </div>
                <IonCol className="w-full flex items-center justify-center mt-2">
                    <button
                        onClick={handleShare}
                        className="flex items-center font-medium justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-xl w-[90%] shadow-lg max-w-[320px] font-poppins"
                    >
                        <QRCodeScanner className="ml-[5px] h-[30px] w-[30px] mr-2" />
                        Share Code
                    </button>
                </IonCol>
            </ModalLayout>
        </IonPage>
    );
};

export default AddressBookQRCode;
