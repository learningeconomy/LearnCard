import React, { useState, useEffect } from 'react';

import Did from '@components/Did';
import AddCredential from '@components/AddCredential';
import GetCredential from '@components/GetCredential';
import GetCredentials from '@components/GetCredentials';
import ReadFromCeramic from '@components/ReadFromCeramic';
import IssueCredential from '@components/IssueCredential';
import VerifyCredential from '@components/VerifyCredential';
import RemoveCredential from '@components/RemoveCredential';
import PublishCredential from '@components/PublishCredential';
import IssuePresentation from '@components/IssuePresentation';
import VerifyPresentation from '@components/VerifyPresentation';
import GetCredentialsList from '@components/GetCredentialsList';

import { useIsSnapReady } from '@state/snapState';
import { modalComponent, useModalStore } from '@state/modal';

const Tabs = {
    'View Dids': <Did />,
    'Add Credential': <AddCredential />,
    'Get Credential': <GetCredential />,
    'Get Credentials': <GetCredentials />,
    'Read From Ceramic': <ReadFromCeramic />,
    'Issue Credential': <IssueCredential />,
    'Verify Credential': <VerifyCredential />,
    'Remove Credential': <RemoveCredential />,
    'Publish Credential': <PublishCredential />,
    'Issue Presentation': <IssuePresentation />,
    'Verify Presentation': <VerifyPresentation />,
    'Get Credentials List': <GetCredentialsList />,
};

const options = Object.keys(Tabs).map(option => (
    <option key={option} value={option}>
        {option}
    </option>
));

const SnapInfo: React.FC = () => {
    const [tab, setTab] = useState<keyof typeof Tabs>('View Dids');

    const isSnapReady = useIsSnapReady();
    const modal = useModalStore();

    useEffect(() => {
        if (tab) modalComponent.set(Tabs[tab]);
    }, [tab]);

    if (!isSnapReady) return <></>;

    return (
        <section className="h-full flex flex-col gap-2">
            <section className="flex p-2">
                <select onChange={e => setTab(e.target.value as keyof typeof Tabs)} value={tab}>
                    {options}
                </select>
                <output className="pl-2 ml-2 border-l">{tab}</output>
            </section>

            <section className="flex-grow border-t overflow-auto">{modal}</section>
        </section>
    );
};

export default SnapInfo;
