import React, { useState, useRef } from 'react';
import { Clipboard } from '@capacitor/clipboard';

import {
    IonPage,
    IonGrid,
    IonRow,
    IonContent,
    IonHeader,
    IonToolbar,
    IonModal,
    IonButtons,
    IonButton,
    IonTitle,
} from '@ionic/react';
import { useIsLoggedIn, useToast, ToastTypeEnum } from 'learn-card-base';

import X from '../svgs/X';
import InfoIcon from '../svgs/InfoIcon';
import CopyStack from '../svgs/CopyStack';
import Checkmark from '../svgs/Checkmark';
import RightArrow from '../svgs/RightArrow';
import SharedBoostVerificationItem from './SharedBoostVerificationItem';

import { VC, VerificationItem, VerificationStatusEnum } from '@learncard/types';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';

export const getColorForVerificationStatus = (
    status: (typeof VerificationStatusEnum)[keyof typeof VerificationStatusEnum]
) => {
    switch (status) {
        case VerificationStatusEnum.Success:
            return '#39B54A';
        case VerificationStatusEnum.Failed:
            return '#D01012';
        case VerificationStatusEnum.Error:
            return '#FFBD06';
        default:
            return '#000000';
    }
};

export enum SharedBoostVerificationBlockViewMode {
    full = 'full',
    mini = 'mini',
    modal = 'modal',
}

const SharedBoostVerificationBlock: React.FC<{
    boost: VC;
    verificationItems: VerificationItem[];
    handleOnClick?: () => void;
    mode?: SharedBoostVerificationBlockViewMode;
    handleCloseModal: () => void;
}> = ({
    boost,
    verificationItems,
    mode = SharedBoostVerificationBlockViewMode.full,
    handleOnClick = () => {},
    handleCloseModal,
}) => {
    const isLoggedIn = useIsLoggedIn();
    const { presentToast } = useToast();
    const [viewJson, setViewJson] = useState<boolean>(false);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
    const jsonModalRef = useRef<HTMLIonModalElement>(null);

    const jsonPrettyPrint = JSON.stringify(boost, null, 2);

    const copyToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: jsonPrettyPrint,
            });
            presentToast('JSON copied to clipboard', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy JSON to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    let worstVerificationStatus = verificationItems.reduce(
        (
            currentWorst: (typeof VerificationStatusEnum)[keyof typeof VerificationStatusEnum],
            verification
        ) => {
            switch (currentWorst) {
                case VerificationStatusEnum.Success:
                    return verification.status;
                case VerificationStatusEnum.Error:
                    return verification.status === VerificationStatusEnum.Failed
                        ? verification.status
                        : currentWorst;
                case VerificationStatusEnum.Failed:
                    return currentWorst;
            }
        },
        VerificationStatusEnum.Success
    );

    let containerStyles = 'w-full h-full flex items-start justify-center bg-grayscale-100';
    let innerContainerStyles =
        'w-full flex flex-col items-center justify-start max-w-[600px] ion-padding bg-grayscale-100';

    if (mode === SharedBoostVerificationBlockViewMode.full) {
        const loggedInStyles = isLoggedIn
            ? 'share-page-verification-loggedIn-block'
            : 'share-page-verification-block';
        containerStyles = `absolute top-[10%] left-[1%] justify-start z-[9999] bg-white min-w-[320px] max-w-[320px] max-h-[100%] rounded-[20px] ion-padding shadow-bottom ${loggedInStyles}`;
        innerContainerStyles = 'w-full flex flex-col items-center justify-start';
    }

    if (mode === SharedBoostVerificationBlockViewMode.mini) {
        const loggedInStyles = isLoggedIn
            ? 'share-page-mobile-loggedIn-verification-block'
            : 'share-page-mobile-verification-block';
        return (
            <div className={`w-full  vc-preview-modal-safe-area ${loggedInStyles}`}>
                <div className="w-full flex items-center justify-center">
                    <div className="flex items-center justify-between w-[40%] min-w-[360px] mb-[10px] bg-white px-4 py-2 rounded-[12px]">
                        <div>
                            Credential Status:{' '}
                            {worstVerificationStatus === VerificationStatusEnum.Success && (
                                <span className="flex items-center justify-start text-emerald-600 font-medium text-lg capitalize">
                                    <Checkmark className="text-emerald-600 w-[20px] h-[20px] mr-2" />{' '}
                                    verified
                                </span>
                            )}
                            {(worstVerificationStatus === VerificationStatusEnum.Failed ||
                                worstVerificationStatus === VerificationStatusEnum.Error) && (
                                <span className="flex items-center justify-start text-red-600 font-medium text-lg capitalize">
                                    <X className="text-red-600 w-[20px] h-[20px] mr-2" />{' '}
                                    {worstVerificationStatus}
                                </span>
                            )}
                        </div>
                        <button onClick={handleOnClick}>
                            <RightArrow className="text-black w-[20px] h-[20px]" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === SharedBoostVerificationBlockViewMode.modal) {
        return (
            <IonPage color="grayscale-100">
                <IonHeader className="w-full">
                    <IonToolbar className="w-full">
                        <div className="w-full flex items-center justify-center pt-4 px-4">
                            <div className="w-full max-w-[600px] flex items-center justify-start mb-2">
                                <button onClick={handleCloseModal} className="mr-2">
                                    <LeftArrow className="text-black w-[20px] h-[20px]" />
                                </button>
                                <h1 className="text-grayscale-900 text-lg font-medium">
                                    Credential Status:{' '}
                                    {worstVerificationStatus === VerificationStatusEnum.Success && (
                                        <span className="flex items-center justify-start text-emerald-600 font-medium text-lg capitalize">
                                            <Checkmark className="text-emerald-600 w-[20px] h-[20px] mr-2" />{' '}
                                            verified
                                        </span>
                                    )}
                                    {(worstVerificationStatus === VerificationStatusEnum.Failed ||
                                        worstVerificationStatus ===
                                            VerificationStatusEnum.Error) && (
                                        <span className="flex items-center justify-start text-red-600 font-medium text-lg capitalize">
                                            <X className="text-red-600 w-[20px] h-[20px] mr-2" />{' '}
                                            {worstVerificationStatus}
                                        </span>
                                    )}
                                </h1>
                            </div>
                        </div>
                    </IonToolbar>
                </IonHeader>
                <IonContent color="grayscale-100">
                    <div className={containerStyles}>
                        <div className={innerContainerStyles}>
                            <div className="w-full ion-padding bg-white rounded-[12px] pt-6 pb-8 shadow-bottom">
                                <button className="w-full flex items-center justify-between mb-2">
                                    <p className="text-grayscale-900">Credential Verifications </p>

                                    <button type="button">
                                        <InfoIcon
                                            fill="#A8ACBD"
                                            className="text-white w-[25px] h-[25px]"
                                        />
                                    </button>
                                </button>

                                {verificationItems?.map((verification, index) => {
                                    const hideBorder = index === verificationItems?.length - 1;

                                    return (
                                        <SharedBoostVerificationItem
                                            verification={verification}
                                            hideBorder={hideBorder}
                                            key={index}
                                        />
                                    );
                                })}

                                <div className="w-full flex flex-col items-start justify-center bg-grayscale-100 rounded-[12px]">
                                    <div className="w-full flex items-center justify-between px-4 py-2">
                                        <button
                                            type="button"
                                            className="w-full rounded-[12px] text-left mt-2 text-[#2F99F0] font-notoSans font-[400] mb-2"
                                            onClick={() => setViewJson(!viewJson)}
                                        >
                                            {viewJson ? 'Hide' : 'View'} json
                                        </button>
                                        <button onClick={copyToClipBoard} type="button">
                                            <CopyStack className="text-[#2F99F0] w-[24px] h-[24px]" />
                                        </button>
                                    </div>
                                    {boost && viewJson && (
                                        <div className="w-full overflow-x-auto overflow-y-auto max-h-[420px] ion-padding text-grayscale-900">
                                            <pre>{jsonPrettyPrint}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const renderJsonModal = () => (
        <IonModal
            isOpen={isJsonModalOpen}
            onDidDismiss={() => setIsJsonModalOpen(false)}
            ref={jsonModalRef}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle>JSON View</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setIsJsonModalOpen(false)}>
                            <X className="text-red-600 w-[20px] h-[20px] mr-2" /> Close
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="w-full flex items-center justify-end mb-4">
                    <button onClick={copyToClipBoard} type="button" className="flex items-center">
                        <CopyStack className="text-[#2F99F0] w-[24px] h-[24px] mr-2" />
                        Copy JSON
                    </button>
                </div>
                {boost && (
                    <pre className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)] text-grayscale-900">
                        {jsonPrettyPrint}
                    </pre>
                )}
            </IonContent>
        </IonModal>
    );

    return (
        <div className={containerStyles}>
            <div className={innerContainerStyles}>
                <div className="w-full flex items-center justify-start mb-2">
                    <h1 className="text-grayscale-900 text-2xl font-medium">
                        Credential Status:{' '}
                        {worstVerificationStatus === VerificationStatusEnum.Success && (
                            <span className="flex items-center justify-start text-emerald-600 font-medium text-2xl capitalize">
                                <Checkmark className="text-emerald-600 w-[20px] h-[20px] mr-2" />{' '}
                                verified
                            </span>
                        )}
                        {(worstVerificationStatus === VerificationStatusEnum.Failed ||
                            worstVerificationStatus === VerificationStatusEnum.Error) && (
                            <span className="flex items-center justify-start text-red-600 font-medium text-2xl capitalize">
                                <X className="text-red-600 w-[20px] h-[20px] mr-2" />{' '}
                                {worstVerificationStatus}
                            </span>
                        )}
                    </h1>
                </div>

                <button className="w-full flex items-center justify-between mb-2">
                    <p className="text-grayscale-900">Credential Verifications </p>

                    <button type="button">
                        <InfoIcon fill="#A8ACBD" className="text-white w-[25px] h-[25px]" />
                    </button>
                </button>

                {verificationItems?.map((verification, index) => {
                    const hideBorder = index === verificationItems?.length - 1;

                    return (
                        <SharedBoostVerificationItem
                            verification={verification}
                            hideBorder={hideBorder}
                            key={index}
                        />
                    );
                })}

                <div className="w-full flex flex-col items-start justify-center bg-grayscale-100 rounded-[12px]">
                    <div className="w-full flex items-center justify-between px-4 py-2">
                        <button
                            type="button"
                            className="w-full rounded-[12px] text-left mt-2 text-[#2F99F0] font-notoSans font-[400] mb-2"
                            onClick={() => boost && setIsJsonModalOpen(true)}
                            disabled={!boost}
                        >
                            View JSON
                        </button>
                        <button onClick={copyToClipBoard} type="button" disabled={!boost}>
                            <CopyStack
                                className={`w-[24px] h-[24px] ${
                                    boost ? 'text-[#2F99F0]' : 'text-gray-400'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {renderJsonModal()}
            </div>
        </div>
    );
};

export default SharedBoostVerificationBlock;
