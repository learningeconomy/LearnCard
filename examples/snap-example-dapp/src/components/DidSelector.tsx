import React from 'react';
import { DidMethod } from '@learncard/didkit-plugin';

type DidSelectorProps = {
    did: string;
    didMethod: DidMethod;
    onChange: (did: DidMethod) => void;
};

const DidSelector: React.FC<DidSelectorProps> = ({ did, didMethod, onChange }) => {
    const options = [
        'key',
        'tz',
        'ethr',
        'pkh:tz',
        'pkh:tezos',
        'pkh:sol',
        'pkh:solana',
        'pkh:eth',
        'pkh:celo',
        'pkh:poly',
        'pkh:btc',
        'pkh:doge',
        'pkh:eip155',
        'pkh:bip122',
        'pkh:eip155:1',
    ].map(option => (
        <option key={option} value={option}>
            {option}
        </option>
    ));

    return (
        <section className="flex p-2 border rounded">
            <select onChange={e => onChange(e.target.value as DidMethod)} value={didMethod}>
                {options}
            </select>
            <output className="pl-2 ml-2 border-l">{did}</output>
        </section>
    );
};

export default DidSelector;
