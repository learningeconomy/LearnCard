import React, { useState, useEffect } from 'react';
import { useIonModal } from '@ionic/react';
import { PaginatedConsentFlowContracts } from '@learncard/types';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import CustomWalletContractData from './CustomWalletContractData';

type CustomWalletViewContractsProps = {
    wallet: BespokeLearnCard;
};

const CustomWalletViewContracts: React.FC<CustomWalletViewContractsProps> = ({ wallet }) => {
    const [contracts, setContracts] = useState<PaginatedConsentFlowContracts['records']>([]);
    const [activeUri, setActiveUri] = useState('');

    const [present, dismiss] = useIonModal(CustomWalletContractData, {
        wallet,
        contractUri: activeUri,
        handleDismissModal: () => dismiss(),
    });

    useEffect(() => {
        wallet.invoke.getContracts().then(result => setContracts(result.records));
    }, []);

    const list = contracts.map(contract => (
        <li key={contract.uri} className="flex gap-2">
            <button
                type="button"
                onClick={() => {
                    setActiveUri(contract.uri);
                    present({ mode: 'ios' });
                }}
                className="flex gap-2"
            >
                <span>{contract.name}</span>
                <span>{contract.uri}</span>
            </button>
        </li>
    ));

    return <ol>{list}</ol>;
};

export default CustomWalletViewContracts;
