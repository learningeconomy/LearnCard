import React from 'react';
import * as m from '../../../paraglide/messages.js';

import AdminToolOptionsList from './AdminToolsOptionsList';
import AdminToolsModalHeader from './AdminToolsModalHeader';
import AdminToolsModalFooter from './AdminToolsModalFooter';
import AdminToolsLaunchDevDocs from './AdminToolsLaunchDevDocs';
import GenericErrorBoundary from 'learn-card-base/components/generic/GenericErrorBoundary';
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
            <AdminToolsModalFooter />
        </div>
    );
};

export default AdminToolsModal;
