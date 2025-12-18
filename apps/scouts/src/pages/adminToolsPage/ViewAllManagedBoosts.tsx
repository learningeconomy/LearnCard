import React from 'react';

import AdminPageStructure from './AdminPageStructure';
import AdminManagedBoostsSection from './AdminManagedBoostsSection';
import AdminTroopsSection from './AdminTroopsSection';

import { BoostCategoryOptionsEnum } from 'learn-card-base';

const ViewAllManagedBoosts: React.FC = () => {
    return (
        <AdminPageStructure title="All Managed Boosts and Badges">
            <section className="flex flex-col gap-[20px]">
                <AdminManagedBoostsSection category={BoostCategoryOptionsEnum.socialBadge} />
                <AdminManagedBoostsSection category={BoostCategoryOptionsEnum.meritBadge} />
                <AdminTroopsSection />
            </section>
        </AdminPageStructure>
    );
};

export default ViewAllManagedBoosts;
