import React from 'react';

import Did from '@components/Did';
import IssueCredential from '@components/IssueCredential';
import VerifyCredential from '@components/VerifyCredential';
import IssuePresentation from '@components/IssuePresentation';
import VerifyPresentation from '@components/VerifyPresentation';

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
            <header className="p-4 border-b flex gap-4">
                <Button component={<Did />}>View Dids</Button>
                <Button component={<IssueCredential />}>Issue Credential</Button>
                <Button component={<VerifyCredential />}>Verify Credential</Button>
                <Button component={<IssuePresentation />}>Issue Presentation</Button>
                <Button component={<VerifyPresentation />}>Verify Presentation</Button>
            </header>

            <section className="flex-grow overflow-auto">{modal}</section>
        </section>
    );
};

export default SnapInfo;
