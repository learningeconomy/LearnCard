import React from 'react';
import { Clipboard } from '@capacitor/clipboard';

import { IonCol, IonRow } from '@ionic/react';
import { QRCodeSVG } from 'qrcode.react';
import CopyStack from '../../components/svgs/CopyStack';

import { ProfilePicture, ToastTypeEnum, useToast } from 'learn-card-base';

import { getConsentFlowLinkForContract } from '../../helpers/contract.helpers';

import { ConsentFlowContractDetails } from '@learncard/types';

type ShareContractModalProps = {
    contract: ConsentFlowContractDetails;
};

const ShareContractModal: React.FC<ShareContractModalProps> = ({ contract }) => {
    const { presentToast } = useToast();

    const { name, image, uri } = contract;

    const shareUrl = getConsentFlowLinkForContract(contract);

    const copyContractLinkToClipboard = async () => {
        try {
            await Clipboard.write({
                string: shareUrl,
            });
            presentToast('Contract link copied to clipboard', {
                className: ToastTypeEnum.CopySuccess,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy contract link to clipboard', {
                className: ToastTypeEnum.CopyFail,
                hasDismissButton: true,
            });
        }
    };

    const copyContractUriToClipboard = async () => {
        try {
            await Clipboard.write({
                string: uri,
            });
            presentToast('Contract URI copied to clipboard', {
                className: ToastTypeEnum.CopySuccess,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy contract URI to clipboard', {
                className: ToastTypeEnum.CopyFail,
                hasDismissButton: true,
            });
        }
    };

    return (
        <div className="text-grayscale-900 px-[20px] py-[30px] flex flex-col gap-[20px] items-center">
            <ProfilePicture
                customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[80px] min-h-[80px]"
                customImageClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden object-cover min-w-[80px] min-h-[80px]"
                customSize={164}
                overrideSrc
                overrideSrcURL={image}
            />

            <p className="text-2xl text-center font-semibold w-full text-grayscale-900">{name}</p>
            <div className="flex justify-center items-center w-full max-w-[400px] relative">
                <div className="max-w-[90%] w-full h-auto relative">
                    <QRCodeSVG
                        className="h-full w-full"
                        value={shareUrl}
                        data-testid="qrcode-card"
                        bgColor="transparent"
                    />
                </div>
            </div>

            <IonRow className="flex items-center justify-center w-full bg-grayscale-100 rounded-[15px] max-w-[400px]">
                <IonCol className="w-full flex items-center justify-between px-4 rounded-2xl">
                    <div className="w-[80%] flex flex-col justify-center items-start text-left">
                        <p className="text-grayscale-500 font-medium text-sm">Share URL</p>
                        <p className="w-full text-grayscale-900 line-clamp-1 tracking-widest">
                            {shareUrl}
                        </p>
                    </div>
                    <div
                        onClick={copyContractLinkToClipboard}
                        className="w-[20%] flex items-center justify-end"
                    >
                        <CopyStack className="w-[32px] h-[32px] text-grayscale-900" />
                    </div>
                </IonCol>
            </IonRow>

            <IonRow className="flex items-center justify-center w-full bg-grayscale-100 rounded-[15px] max-w-[400px]">
                <IonCol className="w-full flex items-center justify-between px-4 rounded-2xl">
                    <div className="w-[80%] flex flex-col justify-center items-start text-left">
                        <p className="text-grayscale-500 font-medium text-sm">Contract URI</p>
                        <p className="w-full text-grayscale-900 line-clamp-1 tracking-widest">
                            {uri}
                        </p>
                    </div>
                    <div
                        onClick={copyContractUriToClipboard}
                        className="w-[20%] flex items-center justify-end"
                    >
                        <CopyStack className="w-[32px] h-[32px] text-grayscale-900" />
                    </div>
                </IonCol>
            </IonRow>
        </div>
    );
};

export default ShareContractModal;
