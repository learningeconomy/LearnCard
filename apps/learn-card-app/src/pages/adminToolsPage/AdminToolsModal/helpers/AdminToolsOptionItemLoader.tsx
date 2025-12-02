import React from 'react';

import { IonSpinner } from '@ionic/react';

const AdminToolsOptionItemLoader: React.FC = () => {
    return (
        <div className="bg-white rounded-[20px] w-[500px] h-[200px] flex flex-col gap-[5px] items-center justify-center">
            <IonSpinner color="grayscale-900" name="crescent" className="w-[50px] h-[50px]" />
            <span className="text-grayscale-900 font-notoSans text-xl mt-2 font-semibold">
                Loading...
            </span>
        </div>
    );
};

export default AdminToolsOptionItemLoader;
