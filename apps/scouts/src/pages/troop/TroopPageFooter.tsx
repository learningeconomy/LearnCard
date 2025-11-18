import React from 'react';
import { useIonAlert } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCanInviteTroop } from './useCanInviteTroop';
import useEditTroopId from '../../hooks/useEditTroopId';
import troopPageStore, { ScoutsRoleEnum } from '../../stores/troopPageStore';
import boostSearchStore from '../../stores/boostSearchStore';

import {
    useGetBoostPermissions,
    useModal,
    ModalTypes,
    useConfirmation,
    useWallet,
} from 'learn-card-base';

import X from 'learn-card-base/svgs/X';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import TroopActionMenu from './TroopActionMenu';
import ScoutConnectModal from './ScoutConnectModal';
import TroopInviteSelectionModal from './TroopInviteSelectionModal';

import { getScoutsRole } from '../../helpers/troop.helpers';
import { VC, Boost } from '@learncard/types';

type TroopPageFooterProps = {
    credential: VC;
    boost?: Boost;
    uri: string;
    handleShare: () => void;
    showIdDetails?: boolean;
    handleDetails?: () => void;
    ownsCurrentId?: boolean;
    isRevoked?: boolean;
};

const TroopPageFooter: React.FC<TroopPageFooterProps> = ({
    credential,
    boost,
    uri,
    handleShare,
    showIdDetails,
    handleDetails,
    ownsCurrentId,
    isRevoked,
}) => {
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const confirm = useConfirmation();
    const [presentAlert] = useIonAlert();
    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const role = getScoutsRole(credential);

    const {
        showInviteButton,
        scoutNoun,
        scoutPermissionsData,
        currentBoostUri,
        scoutBoostUri,
        troopBoostUri,
        troopPermissionsData,
    } = useCanInviteTroop({ credential, boostUri: uri });

    const { openEditTroopOrNetworkModal } = useEditTroopId(credential, uri);

    const { data: boostPermissionsData } = useGetBoostPermissions(uri);
    const canEdit = boostPermissionsData?.canEdit;

    const closeTroopPage = () => {
        if (showIdDetails) {
            setTimeout(() => {
                troopPageStore.set.showIdDetails(false);
            }, 300); // match the closeModal timeout, so it doesn't flash the Troops page before closing
        }

        boostSearchStore.set.reset();
        closeModal();
    };

    const openScoutConnectModal = (boostUri: string) => {
        newModal(
            <ScoutConnectModal
                boostUriForClaimLink={boostUri}
                credential={credential}
                type={scoutNoun}
            />,
            {
                sectionClassName: '!max-w-[450px]',
            }
        );
    };

    const handleDelete = async () => {
        const wallet = await initWallet();
        await confirm({
            text: `Are you sure you want to delete ${credential?.name}?`,
            onConfirm: async () => {
                try {
                    const walletDid = wallet.id.did();
                    await wallet.invoke.deleteBoost(uri);
                    queryClient.invalidateQueries(['useGetIDs', walletDid ?? '']);
                    closeAllModals();
                } catch (error) {
                    if (error) presentAlert(error?.message);
                    closeAllModals();
                }
            },
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
            confirmButtonClassName:
                'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };
    const handleInvite = showInviteButton
        ? () => {
              if (scoutPermissionsData?.canIssue && troopPermissionsData?.canIssue) {
                  newModal(
                      <TroopInviteSelectionModal
                          scoutBoostUri={scoutBoostUri}
                          troopBoostUri={troopBoostUri}
                          credential={credential}
                      />
                  );
              } else if (scoutPermissionsData?.canIssue && !troopPermissionsData?.canIssue) {
                  openScoutConnectModal(scoutBoostUri);
              } else if (boostPermissionsData?.canIssue) {
                  openScoutConnectModal(currentBoostUri);
              } else if (
                  !scoutPermissionsData?.canIssue &&
                  !troopPermissionsData?.canIssue &&
                  !boostPermissionsData?.canIssue
              ) {
                  return;
              }
          }
        : undefined;

    const handleOptions = () => {
        newModal(
            <TroopActionMenu
                handleCloseModal={() => {
                    closeModal();
                }}
                showCloseButton={true}
                handleDeleteBoost={handleDelete}
                handleShareBoost={handleShare}
                handleDetails={handleDetails}
                handleEdit={openEditTroopOrNetworkModal}
                handleInviteMember={handleInvite}
                ownsCurrentId={ownsCurrentId}
                role={role}
                title={credential?.name ?? ''}
            />,
            { sectionClassName: '!max-w-[400px]' }
        );
    };

    const showEditButton = role !== ScoutsRoleEnum.scout && canEdit;

    if (showEditButton) {
        return (
            <footer className="w-full z-[99] bg-white bg-opacity-70 border-t-[1px] border-solid border-white fixed bottom-0 p-[20px] backdrop-blur-[10px] h-[85px]">
                <div className="max-w-[600px] mx-auto flex gap-[10px]">
                    <>
                        <button
                            onClick={showIdDetails ? handleDetails : closeTroopPage}
                            className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                        >
                            Back
                        </button>

                        <button
                            onClick={openEditTroopOrNetworkModal}
                            className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                        >
                            Edit
                        </button>

                        <button
                            onClick={handleOptions}
                            className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom"
                        >
                            <ThreeDots />
                        </button>
                    </>
                </div>
            </footer>
        );
    }

    return (
        <footer className="w-full z-[99] bg-white bg-opacity-70 border-t-[1px] border-solid border-white sticky bottom-0 p-[20px] backdrop-blur-[10px] h-[85px]">
            <div className="max-w-[600px] mx-auto flex gap-[10px]">
                {!showIdDetails && (
                    <>
                        <button
                            onClick={closeTroopPage}
                            className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                        >
                            Back
                        </button>

                        {!isRevoked && (
                            <button
                                onClick={handleOptions}
                                className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom"
                            >
                                <ThreeDots />
                            </button>
                        )}
                    </>
                )}
                {showIdDetails && (
                    <>
                        <button
                            onClick={() => {
                                handleDetails?.();
                            }}
                            className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                        >
                            Back
                        </button>

                        {!isRevoked && (
                            <button
                                onClick={handleOptions}
                                className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom"
                            >
                                <ThreeDots />
                            </button>
                        )}
                    </>
                )}
            </div>
        </footer>
    );
};

export default TroopPageFooter;
