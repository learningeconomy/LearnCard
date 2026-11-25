import React, { useEffect } from 'react';
import { useModal } from 'learn-card-base';
import { useModalInstance } from 'learn-card-base/components/modals/ModalInstanceContext';

import { useCanManageCompetencies } from '../../hooks/useCanManageCompetencies';

/** Remove only the owning modal shell when a competency gate denies access. */
export const useDismissCompetencyAdminModal = (canAccess: boolean): void => {
    const { forceCloseModalByToken } = useModal();
    const { id, generation } = useModalInstance() ?? {};

    useEffect(() => {
        if (!canAccess && id !== undefined && generation !== undefined) {
            // Administrative dismissal avoids save/confirmation callbacks and other overlays.
            forceCloseModalByToken({ id, generation });
        }
    }, [canAccess, id, generation, forceCloseModalByToken]);
};

/** Prevent admin editors and their queries from mounting without global-admin access. */
export const withCompetencyAdmin = <Props extends object>(
    Component: React.ComponentType<Props>
): React.FC<Props> => {
    const CompetencyAdmin: React.FC<Props> = props => {
        const canManageCompetencies = useCanManageCompetencies();
        useDismissCompetencyAdminModal(canManageCompetencies);

        return canManageCompetencies ? <Component {...props} /> : null;
    };

    CompetencyAdmin.displayName = `withCompetencyAdmin(${Component.displayName ?? Component.name})`;

    return CompetencyAdmin;
};
