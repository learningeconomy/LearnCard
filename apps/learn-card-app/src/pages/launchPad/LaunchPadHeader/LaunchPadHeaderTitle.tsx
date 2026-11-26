import React from 'react';

import { AppCol, AppRow } from '../../../components/layout';

const LaunchPadHeaderTitle: React.FC = () => {
    return (
        <AppRow className="w-full flex items-center justify-center mt-[-50px] px-4">
            <AppCol className="flex items-center justify-start w-full max-w-[600px]">
                <h2 className="flex items-center justify-start text-grayscale-900 font-notoSans font-bold text-xl tracking-[0.01rem]">
                    Connections
                </h2>
            </AppCol>
        </AppRow>
    );
};

export default LaunchPadHeaderTitle;
