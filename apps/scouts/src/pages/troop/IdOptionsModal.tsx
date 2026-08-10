import React from 'react';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';

import ViewTroopIdModal from './ViewTroopIdModal';
import ViewJsonModal from '../../components/boost/boost-options-menu/ViewJsonModal';
import CodeIcon from 'learn-card-base/svgs/CodeIcon';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import PeaceIcon from 'learn-card-base/svgs/PeaceIcon';
import GreenScoutsIdCard from '../../components/svgs/GreenScoutsIdCard';
import {
    ModalTypes,
    ProfilePicture,
    useConfirmation,
    useGetCurrentUserTroopIds,
    useModal,
    useResolveBoost,
    useRevokeBoostRecipientGroup,
    useToast,
    ToastTypeEnum,
    useWallet,
} from 'learn-card-base';
import { getScoutsRole } from '../../helpers/troop.helpers';
import { VC } from '@learncard/types';
import * as m from '../../paraglide/messages.js';
import { LoadingSpinner } from 'learn-card-base/components/loaders/LoadingSpinner';
import { getGroupRemovalOutcome } from './groupRemoval.helpers';
import type { TroopIdIssuanceState } from './troopIdStatus.helpers';
import { getLogger } from 'learn-card-base';
const log = getLogger('id-options-modal');

type IdOptionsModalProps = {
    isPersonalId: boolean;
    canManageId: boolean;
    ownerImage: string;
    ownerName: string;
    ownerProfileId: string;
    boostUri: string;
    handleShare: () => void;
    credential: VC;
    credentialUri?: string;
    issuanceState?: TroopIdIssuanceState;
    type?: string;
};

const IdOptionsModal: React.FC<IdOptionsModalProps> = ({
    isPersonalId,
    canManageId,
    ownerImage,
    ownerName,
    ownerProfileId,
    boostUri,
    handleShare,
    credential,
    credentialUri,
    issuanceState,
    type,
}) => {
    const { initWallet } = useWallet();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const { data: troopIds, isLoading: troopIdsLoading } = useGetCurrentUserTroopIds();
    const hasGlobalAdminID = troopIds?.isScoutGlobalAdmin;
    const isTroopLeader = troopIds?.isTroopLeader;

    const { mutateAsync: revokeGroup, isPending: isRevoking } = useRevokeBoostRecipientGroup();

    const role = getScoutsRole(credential);
    const troopOrNetwork =
        role === ScoutsRoleEnum.scout || role === ScoutsRoleEnum.leader
            ? m['troops.troop']()
            : m['troops.network']();
    const isScoutMember = type === 'Scout' || type === 'Member';

    const { data: resolvedCredential } = useResolveBoost(credentialUri ?? boostUri);
    const displayCredential =
        resolvedCredential?.boostCredential ?? resolvedCredential ?? credential;

    const handleViewId = () => {
        closeModal();
        newModal(
            <ViewTroopIdModal
                credential={displayCredential}
                boostUri={boostUri}
                credentialUri={credentialUri}
                issuanceState={issuanceState}
                handleShare={handleShare}
                name={ownerName}
                image={ownerImage}
                profileId={ownerProfileId}
                skipProofCheck
            />
        );
    };

    const handleViewJson = () => {
        closeModal();
        newModal(<ViewJsonModal boost={displayCredential} />, {
            sectionClassName: '!max-h-[90%] !mx-[20px]',
        });
    };

    const handleRemoveFromGroup = async (): Promise<void> => {
        await confirm({
            text: m['troops.options.removeConfirm']({
                owner: ownerName,
                credential: credential?.name ?? '',
            }),
            onConfirm: async () => {
                try {
                    const result = await revokeGroup({
                        boostUri,
                        recipientProfileId: ownerProfileId,
                    });
                    if (getGroupRemovalOutcome(result) === 'partial') {
                        presentToast(m['troops.options.removeFailed']({ owner: ownerName }), {
                            type: ToastTypeEnum.Error,
                            hasDismissButton: true,
                        });
                        return;
                    }

                    presentToast(
                        m['troops.options.removedMsg']({
                            owner: ownerName,
                            credential: credential?.name ?? '',
                        }),
                        { type: ToastTypeEnum.Success, hasDismissButton: true }
                    );
                    closeAllModals();
                } catch (error) {
                    log.error('Failed to remove group member', error);
                    presentToast(m['troops.options.removeFailed']({ owner: ownerName }), {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                }
            },
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
            confirmButtonClassName:
                'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

    const handleRevoke = async () => {
        const wallet = await initWallet();
        void wallet;

        if (isPersonalId) {
            await confirm({
                text: m['troops.options.leaveConfirm']({ credential: credential?.name ?? '' }),
                onConfirm: () => {
                    log.debug('TODO revoke');
                    // closeAllModals();
                },
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            });
        }
    };

    return (
        <div className="flex flex-col px-[30px] py-[20px]">
            {/* hidden for now because Profile has not been implemented */}
            {!isPersonalId && false && (
                <IdOptionRow
                    text={m['troops.actions.viewProfile']()}
                    icon={
                        <ProfilePicture
                            customContainerClass="h-[35px] w-[35px] overflow-hidden"
                            overrideSrcURL={ownerImage}
                            overrideSrc
                        />
                    }
                    onClick={() => log.debug('TODO profile')}
                />
            )}

            <IdOptionRow
                text={m['troops.actions.viewTroopId']()}
                icon={<GreenScoutsIdCard />}
                onClick={handleViewId}
            />

            {isPersonalId && (
                <IdOptionRow
                    text={m['troops.actions.shareId']()}
                    icon={<ReplyIcon size="30" filled={false} />}
                    onClick={() => {
                        closeModal();
                        handleShare();
                    }}
                />
            )}

            <IdOptionRow
                text={m['troops.actions.viewJson']()}
                icon={<CodeIcon />}
                onClick={handleViewJson}
            />

            {isPersonalId && (
                <IdOptionRow
                    text={m['troops.actions.leave']({ name: troopOrNetwork })}
                    icon={<PeaceIcon />}
                    onClick={handleRevoke}
                />
            )}
            {!isPersonalId && (canManageId || hasGlobalAdminID) && type === 'Admin' && (
                <IdOptionRow
                    text={m['troops.actions.removeFrom']({ name: troopOrNetwork })}
                    icon={isRevoking ? <LoadingSpinner /> : <PeaceIcon />}
                    onClick={handleRemoveFromGroup}
                    disabled={isRevoking}
                />
            )}
            {/* Remove Scout option - for troop leaders/admins removing non-admin members */}
            {!isPersonalId &&
                (isTroopLeader || canManageId || hasGlobalAdminID) &&
                isScoutMember && (
                    <IdOptionRow
                        text={m['troops.actions.removeFrom']({ name: troopOrNetwork })}
                        icon={isRevoking ? <LoadingSpinner /> : <PeaceIcon />}
                        onClick={handleRemoveFromGroup}
                        disabled={isRevoking}
                    />
                )}
        </div>
    );
};

type IdOptionRowProps = {
    text: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
};

const IdOptionRow: React.FC<IdOptionRowProps> = ({ text, icon, onClick, disabled = false }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex gap-[10px] items-center py-[10px] text-grayscale-900 border-b-[1px] border-grayscale-200 border-solid last:border-b-0 h-[56px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <span className="font-notoSans text-[17px]">{text}</span>
            <div className="ml-auto">{icon}</div>
        </button>
    );
};

export default IdOptionsModal;
