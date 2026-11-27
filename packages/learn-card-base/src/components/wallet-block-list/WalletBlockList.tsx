import React from 'react';

import { RoundedSquare, RoundedSquareProps } from '@learncard/react';
import { AppItem, AppList } from 'learn-card-base/ui/list';

export const WalletBlockList: React.FC<{ walletItems: RoundedSquareProps[] }> = ({
    walletItems = [],
}) => {
    const walletItemsList = walletItems.map((_item, index) => (
        <AppItem
            key={index}
            lines="none"
            className="w-full max-w-3xl mb-5 mt-5 p-0 shadow-3xl rounded-3xl notificaion-list-item"
        >
            <RoundedSquare />
        </AppItem>
    ));

    return (
        <AppList lines="none" className="flex flex-col items-center justify-center  px-2">
            {walletItemsList}
        </AppList>
    );
};

export default WalletBlockList;
