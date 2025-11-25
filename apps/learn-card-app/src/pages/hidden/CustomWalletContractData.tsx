import React, { useState, useEffect } from 'react';
import { PaginatedConsentFlowData } from '@learncard/types';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

type CustomWalletContractDataProps = {
    wallet: BespokeLearnCard;
    contractUri: string;
    handleDismissModal: () => void;
};

const CustomWalletContractData: React.FC<CustomWalletContractDataProps> = ({
    wallet,
    contractUri,
    handleDismissModal,
}) => {
    const [data, setData] = useState<PaginatedConsentFlowData['records']>([]);

    useEffect(() => {
        wallet.invoke.getConsentFlowData(contractUri).then(result => setData(result.records));
    }, [contractUri]);

    const list = data.map((terms, index) => (
        <li key={terms.personal.Name ?? index} className="flex gap-2 bg-grayscale-900">
            <pre>{JSON.stringify(terms, null, 4)}</pre>
        </li>
    ));

    return (
        <section className="flex flex-col h-full">
            <header className="w-full bg-grayscale-800 p-8 border-b">
                {data.length} Consent(s)
            </header>
            <ol className="flex-grow">{list}</ol>
            <footer className="w-full flex items-center justify-center p-8">
                <button
                    type="button"
                    onClick={handleDismissModal}
                    className="px-4 py-2 border rounded bg-blue-700"
                >
                    Close
                </button>
            </footer>
        </section>
    );
};

export default CustomWalletContractData;
