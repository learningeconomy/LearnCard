import React from 'react';

import AdminToolOptionsList from './AdminToolsOptionsList';
import AdminToolsModalHeader from './AdminToolsModalHeader';
import AdminToolsModalFooter from './AdminToolsModalFooter';
import AdminToolsLaunchDevDocs from './AdminToolsLaunchDevDocs';
import GenericErrorBoundary from '../../../components/generic/GenericErrorBoundary';
import { AdminToolOptionsEnum } from './admin-tools.helpers';

export const AdminToolsModal: React.FC<{ shortCircuitDevTool?: AdminToolOptionsEnum }> = ({
    shortCircuitDevTool,
}) => {
    return (
        <div className="h-full relative">
            <section className="h-full bg-[rgba(53,62,100,0.3)] backdrop-blur-[2px] ion-padding overflow-y-scroll pb-[200px] safe-area-top-margin">
                <GenericErrorBoundary>
                    <AdminToolsModalHeader />

                    <AdminToolOptionsList shortCircuitDevTool={shortCircuitDevTool} />
                    <AdminToolsLaunchDevDocs />
                </GenericErrorBoundary>
            </section>
            <AdminToolsModalFooter buttonTitle="Back" />
        </div>
    );
};

export default AdminToolsModal;
