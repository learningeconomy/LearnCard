import React from 'react';

import BoostOptionsMenu from '../boost-options-menu/BoostOptionsMenu';

import {
    ModalTypes,
    useDeleteEarnedBoostMutation,
    useDeleteManagedBoostMutation,
    useGetBoost,
    useModal,
    useShareBoostMutation,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import { useTroopIDStatus } from '../../../pages/troop/TroopIdStatusButton';

import { isTroopCategory } from '../../../helpers/troop.helpers';

import { UnsignedVC, VC, Boost } from '@learncard/types';

export enum BoostMenuType {
    managed = 'MANAGED',
    earned = 'EARNED',
}

const useBoostMenu = (
    boostCredential: VC | UnsignedVC,
    boostUri: string,
    boost: Boost,
    categoryType: string,
    menuType: BoostMenuType,
    onCloseModal?: () => void,
    onDelete?: () => void
) => {
    const { isLoading } = useGetBoost(boost?.boostId);
    const credentialStatus = useTroopIDStatus(boost, undefined, boost?.boostId);
    const isRevokedOrPending = credentialStatus === 'revoked' || credentialStatus === 'pending';
    const isTroopID = isTroopCategory(categoryType as BoostCategoryOptionsEnum);

    const showDeleteButton = (!isLoading && isRevokedOrPending && isTroopID) || !isTroopID;

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const { mutate: deleteEarnedBoost } = useDeleteEarnedBoostMutation();

    const { mutate: deleteManagedBoost } = useDeleteManagedBoostMutation();

    const { mutate: shareEarnedBoost } = useShareBoostMutation();

    const handleShareBoost = async () => {
        try {
            const res = await shareEarnedBoost({
                credential: boostCredential,
                credentialUri: boostUri,
            });
            return res;
        } catch (e) {
            throw new Error(e);
        }
    };

    const handleDeleteBoost = async () => {
        if (menuType === BoostMenuType.earned) {
            await deleteEarnedBoost({ boostUri, category: categoryType });
        }
        if (menuType === BoostMenuType.managed) {
            await deleteManagedBoost({ boostUri, category: categoryType });
        }
    };

    const handlePresentBoostMenuModal = () => {
        newModal(
            <BoostOptionsMenu
                handleCloseModal={() => {
                    closeModal();
                    onCloseModal?.();
                }}
                boostCredential={boostCredential}
                boost={boost}
                boostUri={boostUri}
                showCloseButton={true}
                showDeleteButton={showDeleteButton}
                handleDeleteBoost={handleDeleteBoost}
                handleShareBoost={handleShareBoost}
                menuType={menuType}
                categoryType={categoryType}
            />,
            { sectionClassName: '!max-w-[400px]' }
        );
    };

    return {
        handlePresentBoostMenuModal,
        handleShareBoost,
        handleDeleteBoost,
    };
};

export default useBoostMenu;
