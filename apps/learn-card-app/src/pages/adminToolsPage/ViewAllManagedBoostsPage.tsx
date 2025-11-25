import React from 'react';

import AdminPageStructure from './AdminPageStructure';
import ViewAllManagedBoosts from './ViewAllManagedBoosts';

const ViewAllManagedBoostsPage: React.FC = () => {
    return (
        <AdminPageStructure title="All Managed Boosts">
            <ViewAllManagedBoosts />
        </AdminPageStructure>
    );
};

export default ViewAllManagedBoostsPage;
