import React from 'react';
import { Updater, useImmer } from 'use-immer';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

import { IonGrid, IonCol, IonRow, IonToolbar, IonHeader, IonToggle } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import ConsentFlowReadSharing from './ConsentFlowReadSharing';
import ConsentFlowWriteSharing from './ConsentFlowWriteSharing';

import { curriedStateSlice } from '@learncard/helpers';
import {
    useModal,
    useToast,
    useConfirmation,
    useWithdrawConsent,
    useDeleteCredentialRecord,
    useGetCredentialsFromContract,
    ToastTypeEnum,
} from 'learn-card-base';

export enum ConsentFlowEditAccessViewModes {
    editAccess = 'edit-access',
    editShareCreds = 'edit-share-creds',
}

type ConsentFlowEditAccessProps = {
    contractDetails: ConsentFlowContractDetails;
    termsUri: string;
    terms: ConsentFlowTerms;
    setTerms: Updater<ConsentFlowTerms>;
    onWithdrawConsent: () => void;
};

const ConsentFlowEditAccess: React.FC<ConsentFlowEditAccessProps> = ({
    contractDetails,
    onWithdrawConsent,
    termsUri,
    terms: initialTerms,
    setTerms: saveTerms,
}) => {
    const confirm = useConfirmation();
    const { closeModal, closeAllModals } = useModal();
    const { presentToast } = useToast();

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();
    const { mutateAsync: withdrawConsent, isPending: isWithdrawingConsent } =
        useWithdrawConsent(termsUri);

    const [terms, setTerms] = useImmer(initialTerms);

    const updateSlice = curriedStateSlice(setTerms);

    const updateRead = curriedStateSlice(updateSlice('read'));

    const updateWrite = curriedStateSlice(updateSlice('write'));
    const updateWriteCredentials = curriedStateSlice(updateWrite('credentials'));

    const allReadToggle = Object.values(terms.read.credentials.categories).every(
        category => category.sharing && category.shareAll
    );
    const allWriteToggle = Object.values(terms.write.credentials.categories).every(Boolean);

    const handleToggleAllReadToggles = () => {
        updateSlice('read', oldRead => {
            Object.keys(oldRead.credentials.categories).forEach(key => {
                oldRead.credentials.categories[key].sharing =
                    !allReadToggle ||
                    oldRead.credentials.categories[key].sharing ||
                    contractDetails?.contract.read.credentials.categories[key]?.required;
                oldRead.credentials.categories[key].shareAll = !allReadToggle;
            });
        });
    };

    const handleToggleAllWriteToggles = () => {
        updateWriteCredentials('categories', oldCategories => {
            Object.keys(oldCategories).forEach(key => {
                oldCategories[key] =
                    !allWriteToggle ||
                    contractDetails?.contract.write.credentials.categories[key]?.required;
            });
        });
    };

    const { data: contractCredentials, isLoading: isLoadingContractCreds } =
        useGetCredentialsFromContract(contractDetails.uri);
    const contractCredentialsExist = (contractCredentials?.length ?? 0) > 0;

    const handleWithdrawConsent = async (options?: { deleteContractCredentials?: boolean }) => {
        const { deleteContractCredentials = false } = options ?? {};

        withdrawConsent(termsUri).then(async () => {
            if (deleteContractCredentials) {
                try {
                    await Promise.all(
                        contractCredentials.map(async contractCred => {
                            await deleteCredentialRecord(contractCred);
                        })
                    );
                    presentToast(
                        `Deleted ${contractCredentials.length} credentials from contract ${contractDetails.name}`,
                        { toastType: ToastTypeEnum.CopySuccess }
                    );
                } catch (e) {
                    presentToast(
                        `Error while deleting credentials from contarct ${contractDetails.name}: ${e.message}`,
                        { toastType: ToastTypeEnum.CopyFail }
                    );
                }
            }
            closeAllModals();
            onWithdrawConsent();
        });
    };

    const handleWithdrawConsentWithBoostCheck = async () => {
        if (!contractCredentialsExist) {
            handleWithdrawConsent();
            return;
        } else {
            await confirm({
                text: (
                    <div className="flex flex-col gap-[5px] mb-[10px]">
                        <span className="font-[600] text-center">
                            You will be disconnected from this contract
                        </span>
                        <span className="text-center">
                            Do you want to delete all credentials associated with this contract?
                        </span>
                    </div>
                ),
                confirmText: 'Yes',
                cancelText: 'No',
                onConfirm: () => handleWithdrawConsent({ deleteContractCredentials: true }),
                onCancel: () => handleWithdrawConsent({ deleteContractCredentials: false }),
            });
        }
    };

    if (!contractDetails) {
        closeModal();

        return <></>;
    }

    const contractReadDataExists =
        Object.keys(contractDetails.contract.read.credentials.categories ?? {}).length > 0 ||
        Object.keys(contractDetails.contract.read.personal ?? {}).length > 0;
    const contractWriteDataExists =
        Object.keys(contractDetails.contract.write.credentials.categories ?? {}).length > 0 ||
        Object.keys(contractDetails.contract.write.personal ?? {}).length > 0;

    return (
        <section className="bg-grayscale-900 pt-[15px] min-h-full">
            <IonHeader className="ion-no-border">
                <IonToolbar className="ion-no-border" color="grayscale-900">
                    <IonGrid className="bg-grayscale-900">
                        <IonRow className="w-full flex flex-col items-center justify-center">
                            <IonRow className="w-full max-w-[600px] flex items-center justify-between">
                                <IonCol className="flex flex-1 justify-start items-center">
                                    <button
                                        className="text-white p-0 mr-[10px]"
                                        aria-label="Back button"
                                        onClick={() => {
                                            saveTerms(terms);
                                            closeModal();
                                        }}
                                    >
                                        <CaretLeft className="h-auto w-3 text-white" />
                                    </button>

                                    <div className="flex items-center justify-normal">
                                        <div className="w-[40px] h-[40px] flex items-center justify-center rounded-[10px] overflow-hidden shadow-sm">
                                            <img
                                                src={
                                                    contractDetails?.image ??
                                                    contractDetails?.owner?.image ??
                                                    ''
                                                }
                                                alt={`${contractDetails?.name}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <h3 className="text-white font-medium flex items-center justify-start font-poppins text-xl ml-2">
                                            {contractDetails?.name}
                                        </h3>
                                    </div>
                                </IonCol>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonGrid className="flex items-center justify-center flex-col w-full px-4 pb-14 gap-5">
                {contractDetails?.reasonForAccessing && (
                    <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <IonCol
                            size="12"
                            className="flex flex-col items-center justify-between w-full bg-white rounded-[20px] ion-padding"
                        >
                            <p className="text-grayscale-900 text-base w-full text-left mb-4 font-medium">
                                {contractDetails?.owner?.displayName || contractDetails?.name} will
                                use data to:
                            </p>
                            <p className="text-grayscale-600 text-sm w-full text-left">
                                {contractDetails?.reasonForAccessing}
                            </p>
                        </IonCol>
                    </IonRow>
                )}

                <IonRow className="w-full max-w-[600px]">
                    <IonCol
                        size="12"
                        className="flex flex-col gap-5 py-2 items-center justify-between w-full"
                    >
                        <h4 className="text-white text-xl tracking-normal w-full text-left mb-4 font-medium font-poppins">
                            Share Data in Your LearnCard
                        </h4>

                        {contractReadDataExists && (
                            <fieldset className="w-full flex flex-col gap-1">
                                <section className="w-full flex justify-between items-center">
                                    <label className="flex flex-col gap-1">
                                        <output
                                            className={`font-semibold text-sm ${allReadToggle
                                                    ? 'text-emerald-700'
                                                    : 'text-grayscale-400'
                                                }`}
                                        >
                                            {allReadToggle ? 'Active' : 'Off'}
                                        </output>
                                        <p className="font-poppins text-grayscale-100 text-xl">
                                            Live Sync All
                                        </p>
                                    </label>

                                    <IonToggle
                                        mode="ios"
                                        className="[--background:white]"
                                        color="emerald-700"
                                        onClick={handleToggleAllReadToggles}
                                        checked={allReadToggle}
                                    />
                                </section>

                                <p className="text-grayscale-100 text-base font-normal font-poppins">
                                    Turning on live syncing will continuosly share your credentials
                                    as you get them. This can be enabled/disabled per category at
                                    any time.
                                </p>
                            </fieldset>
                        )}
                        {!contractReadDataExists && (
                            <p className="text-grayscale-100 text-base font-normal font-poppins">
                                This contract is not reading any data from your LearnCard
                            </p>
                        )}
                    </IonCol>
                </IonRow>

                {contractReadDataExists && (
                    <IonRow className="w-full max-w-[600px]">
                        <IonCol
                            size="12"
                            className="flex flex-col gap-5 py-2 items-center justify-between w-full"
                        >
                            <ConsentFlowReadSharing
                                contract={contractDetails.contract.read}
                                terms={terms.read}
                                setState={updateSlice('read')}
                                contractOwnerDid={contractDetails.owner.did}
                            />
                        </IonCol>
                    </IonRow>
                )}

                <IonRow className="w-full max-w-[600px]">
                    <IonCol
                        size="12"
                        className="flex flex-col gap-5 py-2 items-center justify-between w-full"
                    >
                        <h4 className="text-white text-xl tracking-normal w-full text-left mb-4 font-medium font-poppins">
                            Allow Data to be Added to Your LearnCard
                        </h4>

                        {contractWriteDataExists && (
                            <fieldset className="w-full flex flex-col gap-1">
                                <section className="w-full flex justify-between items-center">
                                    <label className="flex flex-col gap-1">
                                        <output
                                            className={`font-semibold text-sm ${allWriteToggle
                                                    ? 'text-emerald-700'
                                                    : 'text-grayscale-400'
                                                }`}
                                        >
                                            {allWriteToggle ? 'Active' : 'Off'}
                                        </output>
                                        <p className="font-poppins text-grayscale-100 text-xl">
                                            Allow All
                                        </p>
                                    </label>

                                    <IonToggle
                                        mode="ios"
                                        className="[--background:white]"
                                        color="emerald-700"
                                        onClick={handleToggleAllWriteToggles}
                                        checked={allWriteToggle}
                                    />
                                </section>
                            </fieldset>
                        )}
                        {!contractWriteDataExists && (
                            <p className="text-grayscale-100 text-base font-normal font-poppins">
                                This contract is not writing any data to your LearnCard
                            </p>
                        )}
                    </IonCol>
                </IonRow>

                {contractWriteDataExists && (
                    <IonRow className="w-full max-w-[600px]">
                        <IonCol
                            size="12"
                            className="flex flex-col gap-5 py-2 items-center justify-between w-full"
                        >
                            <ConsentFlowWriteSharing
                                contract={contractDetails.contract.write}
                                terms={terms.write}
                                setState={updateSlice('write')}
                            />
                        </IonCol>
                    </IonRow>
                )}

                {contractReadDataExists && (
                    <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] rounded-[20px]">
                        <IonCol
                            size="12"
                            className="flex items-center justify-between w-full bg-white rounded-[20px] ion-padding"
                        >
                            <div className="flex items-center justify-between w-full">
                                <h1 className="font-poppins text-black text-lg p-0 m-0 normal">
                                    Anonymize Data
                                </h1>
                            </div>

                            <IonToggle
                                mode="ios"
                                color="emerald-700"
                                onClick={() => updateRead('anonymize', !terms.read.anonymize)}
                                checked={terms.read.anonymize}
                            />
                        </IonCol>
                    </IonRow>
                )}

                {termsUri && (
                    <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px]">
                        <div className="w-full flex items-center justify-center mt-6 mb-4">
                            <div className="bg-grayscale-100 w-full h-[1px]" />
                        </div>

                        <IonCol
                            size="12"
                            className="flex flex-col items-center justify-between w-full ion-padding"
                        >
                            <button
                                type="button"
                                className="w-full flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-red-600 font-poppins text-xl shadow-3xl normal disabled:opacity-80"
                                onClick={handleWithdrawConsentWithBoostCheck}
                                disabled={isLoadingContractCreds}
                            >
                                {/* <BrokenLink className="mr-2" />{' '} */}
                                {isWithdrawingConsent ? 'Disconnecting...' : 'Disconnect'}
                            </button>
                        </IonCol>
                    </IonRow>
                )}
            </IonGrid>
        </section>
    );
};

export default ConsentFlowEditAccess;
