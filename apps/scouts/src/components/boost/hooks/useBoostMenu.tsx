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

type BoostOptionsMenuProps = React.ComponentProps<typeof BoostOptionsMenu>;

/**
 * Troop IDs can only be deleted once they're revoked or still pending, which takes two
 * getBoostRecipients calls to find out. Rendered inside the menu modal so those calls only
 * happen once someone actually opens the menu, and so the Delete option shows up as soon as
 * the status resolves (newModal snapshots its props, so a status computed outside the modal
 * would stay frozen at whatever it was when the menu opened).
 */
const TroopIDBoostOptionsMenu: React.FC<
    Omit<BoostOptionsMenuProps, 'showDeleteButton'>
> = props => {
    const { boost } = props;
    const { isLoading } = useGetBoost(boost?.boostId);
    const credentialStatus = useTroopIDStatus(boost, undefined, boost?.boostId);
    const isRevokedOrPending = credentialStatus === 'revoked' || credentialStatus === 'pending';

    return <BoostOptionsMenu {...props} showDeleteButton={!isLoading && isRevokedOrPending} />;
};

export const BoostMenuContent: React.FC<
    Omit<BoostOptionsMenuProps, 'showDeleteButton'> & { isTroopID: boolean }
> = ({ isTroopID, ...props }) => {
    // Non-troop-ID boosts can always be deleted, so there's nothing to look up.
    if (!isTroopID) return <BoostOptionsMenu {...props} showDeleteButton />;

    return <TroopIDBoostOptionsMenu {...props} />;
};

const useBoostMenu = (
    boostCredential: VC | UnsignedVC,
    boostUri: string,
    boost: Boost,
    categoryType: string,
    menuType: BoostMenuType,
    onCloseModal?: () => void,
    onDelete?: () => void
) => {
    const isTroopID = isTroopCategory(categoryType as BoostCategoryOptionsEnum);

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
            throw new Error(String(e), { cause: e });
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
            <BoostMenuContent
                isTroopID={isTroopID}
                handleCloseModal={() => {
                    closeModal();
                    onCloseModal?.();
                }}
                boostCredential={boostCredential}
                boost={boost}
                boostUri={boostUri}
                showCloseButton={true}
                handleDeleteBoost={handleDeleteBoost}
                handleShareBoost={handleShareBoost}
                menuType={menuType}
                categoryType={categoryType}
            />,
            { sectionClassName: 'max-w-[400px]!' }
        );
    };

    return {
        handlePresentBoostMenuModal,
        handleShareBoost,
        handleDeleteBoost,
    };
};

export default useBoostMenu;
