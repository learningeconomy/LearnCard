import React from 'react';

import { useCanManageCompetencies } from '../../hooks/useCanManageCompetencies';

/** Prevent admin editors and their queries from mounting without global-admin access. */
export const withCompetencyAdmin = <Props extends object>(
    Component: React.ComponentType<Props>
): React.FC<Props> => {
    const CompetencyAdmin: React.FC<Props> = props => {
        const canManageCompetencies = useCanManageCompetencies();

        return canManageCompetencies ? <Component {...props} /> : null;
    };

    CompetencyAdmin.displayName = `withCompetencyAdmin(${Component.displayName ?? Component.name})`;

    return CompetencyAdmin;
};
