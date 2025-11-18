import React from 'react';

import { IonItem, IonList } from '@ionic/react';

import { RoundedSquare, RoundedSquareProps } from '@learncard/react';

export const WalletBlockList: React.FC<{ walletItems: RoundedSquareProps[] }> = ({
    walletItems = [],
}) => {
    const walletItemsList = walletItems.map((_item, index) => (
        <IonItem
            key={index}
            lines="none"
            className="w-full max-w-3xl mb-5 mt-5 p-0 shadow-3xl rounded-3xl notificaion-list-item"
        >
            <RoundedSquare />
        </IonItem>
    ));

    return (
        <IonList lines="none" className="flex flex-col items-center justify-center  px-2">
            {walletItemsList}
        </IonList>
    );
};

export default WalletBlockList;
