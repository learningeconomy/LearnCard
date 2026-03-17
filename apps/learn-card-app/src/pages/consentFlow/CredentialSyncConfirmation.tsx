import React, { useState } from 'react';
import { useImmer } from 'use-immer';
import { useHistory } from 'react-router-dom';

import { useModal, useToast, ToastTypeEnum, useCurrentUser, ModalTypes } from 'learn-card-base';
import { useGuardianGate } from '../../hooks/useGuardianGate';

import Plus from 'learn-card-base/svgs/Plus';
import Refresh from 'learn-card-base/svgs/Refresh';
import LoadingIcon from 'learn-card-base/svgs/LoadingIcon';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import LearnCardAppIcon from '../../assets/images/lca-icon-v2.png';
import ConsentFlowEditAccess from '../launchPad/ConsentFlowEditAccess';
import { Checkmark } from '@learncard/react';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import { getContractTermsInfo, getMinimumTermsForContract } from '../../helpers/contract.helpers';

import useTheme from '../../theme/hooks/useTheme';

enum SyncStateEnum {
    notSynced = 'Accept & Sync',
    syncing = 'Syncing...',
    synced = 'Done!',
    error = 'Try Again',
}

export type CredentialSyncConfirmationProps = {
    contractDetails: ConsentFlowContractDetails;
    handleAcceptContract: (terms?: ConsentFlowTerms) => Promise<void>;
};

const CredentialSyncConfirmation: React.FC<CredentialSyncConfirmationProps> = ({
    contractDetails,
    handleAcceptContract,
}) => {
    const history = useHistory();
    const { newModal, closeModal } = useModal();
    const { presentToast } = useToast();

    const currentUser = useCurrentUser()!!!!!!!!!;

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [syncState, setSyncState] = useState(SyncStateEnum.notSynced);

    // Guardian gate for child profiles
    const { guardedAction } = useGuardianGate();

    const [terms, setTerms] = useImmer(
        contractDetails?.contract
            ? getMinimumTermsForContract(contractDetails.contract, currentUser)
            : ({} as ConsentFlowTerms)
    );

    const handleSync = async () => {
        await guardedAction(async () => {
            setSyncState(SyncStateEnum.syncing);
            try {
                await handleAcceptContract(terms);
                setSyncState(SyncStateEnum.synced);
                setTimeout(() => {
                    closeModal();
                    history.push('/wallet');
                }, 500);
            } catch (e) {
                presentToast(`Something went wrong: ${e.message}`, {
                    type: ToastTypeEnum.Error,
                });
                console.error(e);
                setSyncState(SyncStateEnum.error);
            }
        });
    };

    const handleEditAccess = () => {
        newModal(
            <ConsentFlowEditAccess
                contractDetails={contractDetails}
                terms={terms}
                setTerms={setTerms}
            />,
            undefined,
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const { requestingRead, requestingWrite } = getContractTermsInfo(contractDetails);

    const { name, image, subtitle, reasonForAccessing } = contractDetails;

    let syncIcon: React.ReactNode;
    switch (syncState) {
        case SyncStateEnum.synced:
            syncIcon = <Checkmark className="text-emerald-700 h-[35px] w-[35px] mt-[4px]" />;
            break;
        case SyncStateEnum.syncing:
            syncIcon = <LoadingIcon className="animate-spin" />;
            break;
        /* case SYNC_STATE.reconnect:
            syncIcon = <BrokenLink />;
            break; */
        case SyncStateEnum.error:
            syncIcon = <Refresh />;
            break;
        case SyncStateEnum.notSynced:
        default:
            syncIcon = <SkinnyCaretRight />;
    }

    return (
        <section className="w-full flex flex-col gap-[20px] items-center px-[30px] py-[30px] bg-white shadow-bottom rounded-[24px]">
            <header className="flex items-center flex-col gap-[10px] border-solid border-b-[1px] border-grayscale-200 pb-[20px] w-full">
                <div className="flex items-center justify-start w-[120px]">
                    <div className="flex items-end justify-center relative">
                        <div className="w-[80px] h-[80px] rounded-full overflow-hidden">
                            <img
                                src={image}
                                alt="Contract Icon"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="w-[20px] h-[20px] p-[2px] rounded-full overflow-hidden absolute bottom-[12px] right-[-2px] shadow-box-bottom bg-white z-10">
                            <Plus className="text-grayscale-900" />
                        </div>

                        {/* {currentLCNUser ? (
                            <UserProfilePicture
                                customContainerClass="w-[44px] h-[44px] rounded-full overflow-hidden border-b-solid baorder-white border-2 !absolute bottom-0 right-[-40px] shadow-bottom text-white font-medium text-2xl"
                                customImageClass="h-full w-full object-cover"
                                customSize={120}
                                user={user}
                            />
                        ) : ( */}
                        <div className="w-[44px] h-[44px] rounded-[10px] overflow-hidden border-b-solid border-white border-[2px] absolute bottom-[0px] right-[-40px] drop-shadow-bottom bg-white">
                            <img
                                src={LearnCardAppIcon}
                                alt="LearnCard App Icon"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        {/* )} */}
                    </div>
                </div>
                <span className="text-grayscale-900 font-poppins text-[31px] leading-[130%] text-center">
                    {name}
                </span>

                <span className="text-grayscale-700 text-[14px]">{subtitle}</span>
            </header>

            {(requestingRead || requestingWrite) && (
                <div className="flex flex-col gap-[10px] items-center w-full">
                    <span className="text-grayscale-900 text-[20px] font-poppins font-[600] leading-[160%]">
                        Requesting Permissions
                    </span>
                    <button
                        type="button"
                        className={`flex gap-[10px] rounded-[15px] px-[30px] py-[10px] items-center bg-${primaryColor}`}
                        onClick={handleEditAccess}
                    >
                        <div className="flex flex-col text-white font-poppins grow">
                            <span className="text-[17px] font-[600]">Edit Access</span>
                        </div>
                    </button>
                </div>
            )}

            <div className="flex flex-col gap-[10px] items-center w-full">
                <span className="text-grayscale-900 text-[20px] font-poppins font-[600] leading-[160%]">
                    Adding New Credentials
                </span>

                <button
                    type="button"
                    className={`w-full flex gap-[10px] rounded-[30px] p-[2px] items-center ${
                        syncState === SyncStateEnum.synced ? 'bg-emerald-700' : 'bg-grayscale-700'
                    }`}
                    onClick={handleSync}
                    disabled={
                        syncState !== SyncStateEnum.notSynced && syncState !== SyncStateEnum.error
                    }
                >
                    <div className="bg-white h-[45px] w-[45px] rounded-full shrink-0 flex items-center justify-center">
                        <img src={image} alt={'icon'} className="h-full w-full rounded-full" />
                    </div>
                    <div className="flex flex-col text-white font-poppins grow">
                        {/* <span className="line-clamp-1 text-[14px]">{name}</span> */}
                        <span className="text-[17px] font-[600]">{syncState}</span>
                    </div>
                    <div
                        className={`h-[45px] w-[45px] rounded-full flex items-center justify-center shrink-0 ${
                            syncState === SyncStateEnum.notSynced ? 'bg-grayscale-900' : 'bg-white'
                        }`}
                    >
                        {syncIcon}
                    </div>
                </button>
            </div>

            <div className="text-grayscale-900 text-[16px]">
                <button
                    type="button"
                    onClick={closeModal}
                    className={`text-${primaryColor} font-[600]`}
                >
                    Close
                </button>
            </div>
        </section>
    );
};

export default CredentialSyncConfirmation;
