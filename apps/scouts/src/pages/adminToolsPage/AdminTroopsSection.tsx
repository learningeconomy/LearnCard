import React from 'react';

import { useGetIDs } from 'learn-card-base';

import AdminTroopRow from './AdminTroopRow';
import { IonSpinner } from '@ionic/react';
import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';

type AdminTroopsSectionProps = {};

const AdminTroopsSection: React.FC<AdminTroopsSectionProps> = () => {
    const { data: troops, isLoading: troopsLoading } = useGetIDs();

    return (
        <div className="min-w-[400px]">
            <h2 className="flex gap-[10px] items-center mb-[10px] text-sp-green-base text-[22px]">
                <GreenScoutsPledge2 className="h-[36px] w-[36px]" />
                Troops
            </h2>

            <div className="flex flex-col gap-[10px] pl-[15px]">
                {troops?.map((troop, index) => {
                    return <AdminTroopRow key={`troop-${index}`} credential={troop} />;
                })}
                {troopsLoading && <IonSpinner color="dark" />}
            </div>
        </div>
    );
};

export default AdminTroopsSection;
