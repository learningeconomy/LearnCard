import React from 'react';

import CheckList from './CheckList';
import ChecklistHeader from './CheckListHeader';
import CheckListFooter from './CheckListFooter';
import CheckListDisclaimer from './checklist-disclaimer/CheckListDisclaimer';

import { ChecklistEnum } from 'learn-card-base';
import GenericErrorBoundary from '../../generic/GenericErrorBoundary';
import CredentialIntakeOptions from './CredentialIntakeOptions';
import DemoSchoolBox from './DemoSchoolBox';
import SampleWalletBox from '../sample-wallet/SampleWalletBox';
import UploadJsonVcBox from './UploadJsonVcBox';

export const CheckListContainer: React.FC<{ activeChecklistStep?: ChecklistEnum }> = ({
    activeChecklistStep,
}) => {
    return (
        <div className="h-full relative">
            <section className="h-full bg-[rgba(53,62,100,0.3)] backdrop-blur-[2px] ion-padding overflow-y-scroll pb-[200px] safe-area-top-margin">
                <GenericErrorBoundary>
                    <ChecklistHeader />
                    <SampleWalletBox />
                    <DemoSchoolBox />
                    <CheckList activeChecklistStep={activeChecklistStep} />
                    <CredentialIntakeOptions />
                    <UploadJsonVcBox />
                    {/* <CheckListDisclaimer /> */}
                </GenericErrorBoundary>
            </section>
            <CheckListFooter />
        </div>
    );
};

export default CheckListContainer;
