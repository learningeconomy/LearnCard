import React from 'react';

import Did from '@components/Did';
import AddCredential from '@components/AddCredential';
import GetCredential from '@components/GetCredential';
import GetCredentials from '@components/GetCredentials';
import IssueCredential from '@components/IssueCredential';
import VerifyCredential from '@components/VerifyCredential';
import PublishCredential from '@components/PublishCredential';
import IssuePresentation from '@components/IssuePresentation';
import VerifyPresentation from '@components/VerifyPresentation';
import GetCredentialsList from '@components/GetCredentialsList';

import { useIsSnapReady } from '@state/snapState';
import { modalComponent, useModalStore } from '@state/modal';

const Button: React.FC<{ component: JSX.Element }> = ({ component, children }) => (
    <button
        className="border rounded bg-green-300 p-4"
        type="button"
        onClick={() => modalComponent.set(component)}
    >
        {children}
    </button>
);
const SnapInfo: React.FC = () => {
    const isSnapReady = useIsSnapReady();
    const modal = useModalStore();

    if (!isSnapReady) return <></>;

    return (
        <section className="h-full flex flex-col gap-2">
            <header className="p-4 flex gap-4">
                <Button component={<Did />}>View Dids</Button>
                <Button component={<AddCredential />}>Add Credential</Button>
                <Button component={<GetCredential />}>Get Credential</Button>
                <Button component={<GetCredentials />}>Get Credentials</Button>
                <Button component={<IssueCredential />}>Issue Credential</Button>
                <Button component={<VerifyCredential />}>Verify Credential</Button>
                <Button component={<PublishCredential />}>Publish Credential</Button>
                <Button component={<IssuePresentation />}>Issue Presentation</Button>
                <Button component={<VerifyPresentation />}>Verify Presentation</Button>
                <Button component={<GetCredentialsList />}>Get Credentials List</Button>
            </header>

            <section className="flex-grow border-t overflow-auto">{modal}</section>
        </section>
    );
};

export default SnapInfo;
