import React, { useEffect, useState } from 'react';

import { LaunchPadAppListItem, useWallet } from 'learn-card-base';
import { aiAppProfileOptions } from './aiPassport-app-options.helpers';
import AiPassportAppProfileOptionsItem from './AiPassportAppProfileOptionsItem';
import { DEFAULT_QA_CREDENTIAL_ID } from '../../ai-passport/personalizedQuestionCredential.helpers';

export const AiPassportAppProfileOptions: React.FC<{ app: LaunchPadAppListItem }> = ({ app }) => {
    const { initWallet } = useWallet();

    const [uri, setUri] = useState<string>('');

    const handleGetQACredential = async () => {
        const wallet = await initWallet();

        try {
            const record = await wallet.index.LearnCloud.get({ id: DEFAULT_QA_CREDENTIAL_ID });
            const recordUri = record?.[0]?.uri as string;

            setUri(recordUri);
        } catch (error) {
            console.log('handleGetQACredential::error', error);
        }
    };

    useEffect(() => {
        handleGetQACredential();
    }, [uri]);

    return (
        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
            {aiAppProfileOptions.map(option => {
                return (
                    <AiPassportAppProfileOptionsItem
                        app={app}
                        option={option}
                        key={option.id}
                        qaUri={uri}
                    />
                );
            })}
        </div>
    );
};

export default AiPassportAppProfileOptions;
