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
    useRevokeBoostRecipient,
    useToast,
    ToastTypeEnum,
    useWallet,
} from 'learn-card-base';
import { getScoutsRole } from '../../helpers/troop.helpers';
import { VC } from '@learncard/types';
import { PermissionsByRole } from '../../components/troopsCMS/troops.helpers';
import * as m from '../../paraglide/messages.js';
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

    const { mutateAsync: revokeBoostRecipient, isPending: isRevoking } = useRevokeBoostRecipient();

    const role = getScoutsRole(credential);
    const troopOrNetwork =
        role === ScoutsRoleEnum.scout || role === ScoutsRoleEnum.leader
            ? m['troops.troop']()
            : m['troops.network']();
    const isScoutMember = type === 'Scout' || type === 'Member';

    const { data: resolvedCredential } = useResolveBoost(boostUri);
    const _credential = resolvedCredential ?? credential;

    const handleViewId = () => {
        closeModal();
        newModal(
            <ViewTroopIdModal
                credential={_credential}
                boostUri={boostUri}
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
        newModal(<ViewJsonModal boost={_credential} />, {
            sectionClassName: '!max-h-[90%] !mx-[20px]',
        });
    };

    const handleRevokeScout = async () => {
        await confirm({
            text: m['troops.options.removeConfirm']({
                owner: ownerName,
                credential: credential?.name ?? '',
            }),
            onConfirm: async () => {
                try {
                    await revokeBoostRecipient({
                        boostUri,
                        recipientProfileId: ownerProfileId,
                    });
                    presentToast(
                        m['troops.options.removedMsg']({
                            owner: ownerName,
                            credential: credential?.name ?? '',
                        }),
                        {
                            type: ToastTypeEnum.Success,
                        }
                    );
                    closeAllModals();
                } catch (error) {
                    log.error('Failed to revoke scout:', error);
                    presentToast(m['troops.options.removeFailed']({ owner: ownerName }), {
                        type: ToastTypeEnum.Error,
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
        } else {
            await confirm({
                text: m['troops.options.removeConfirm']({
                    owner: ownerName,
                    credential: credential?.name ?? '',
                }),
                onConfirm: async () => {
                    const removedAdmin = await wallet?.invoke?.removeBoostAdmin(
                        boostUri,
                        ownerProfileId
                    );

                    const updates = PermissionsByRole.troop;
                    const updatedPermissions = await wallet?.invoke?.updateBoostPermissions(
                        boostUri,
                        { ...updates },
                        ownerProfileId
                    );

                    closeAllModals();
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
                    icon={<PeaceIcon />}
                    onClick={handleRevoke}
                />
            )}
            {/* Remove Scout option - for troop leaders/admins removing non-admin members */}
            {!isPersonalId &&
                (isTroopLeader || canManageId || hasGlobalAdminID) &&
                isScoutMember && (
                    <IdOptionRow
                        text={m['troops.actions.removeFrom']({ name: troopOrNetwork })}
                        icon={<PeaceIcon />}
                        onClick={handleRevokeScout}
                    />
                )}
        </div>
    );
};

type IdOptionRowProps = {
    text: string;
    icon: React.ReactNode;
    onClick: () => void;
};

const IdOptionRow: React.FC<IdOptionRowProps> = ({ text, icon, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex gap-[10px] items-center py-[10px] text-grayscale-900 border-b-[1px] border-grayscale-200 border-solid last:border-b-0 h-[56px]"
        >
            <span className="font-notoSans text-[17px]">{text}</span>
            <div className="ml-auto">{icon}</div>
        </button>
    );
};

export default IdOptionsModal;
