import React from 'react';

import AdminToolsModalFooter from './AdminToolsModalFooter';
import AdminToolsNetworkOption from '../AdminToolsNetwork/AdminToolsNetwork';
import AdminToolsApiTokensOption from '../api-tokens/AdminToolsApiTokensOption';
import AdminToolsOptionsContainerHeader from './AdminToolsOptionsContainerHeader';
import AdminToolsStorageOption from '../AdminToolsStorage/AdminToolsStorageOption';
import AdminToolsBulkBoostImportOption from '../bulk-import/AdminToolsBulkBoostImportOption';
import AdminToolsConsentFlowOption from '../AdminToolsConsentFlow/AdminToolsConsentFlowOption';
import AdminToolsSigningAuthorityOption from '../signingAuthority/AdminToolsSigningAuthorityOption';
import AdminToolsSyncAllCredentialsOption from '../AdminToolsSyncAllCredentials/AdminToolsSyncAllCredentialsOption';
import AdminToolsCLIOption from '../AdminToolsCLI/AdminToolsCLIOption';
import AdminToolsLearnerContextTestOption from '../learner-context-test/AdminToolsLearnerContextTestOption';

import { AdminToolOption, AdminToolOptionsEnum } from './admin-tools.helpers';

export const AdminToolsOptionsContainer: React.FC<{ option: AdminToolOption }> = ({ option }) => {
    const activeAdminToolOption: AdminToolOptionsEnum = option.type;

    const adminToolContent: React.ReactNode = (() => {
        switch (activeAdminToolOption) {
            case AdminToolOptionsEnum.API_TOKENS:
                return <AdminToolsApiTokensOption option={option} />;
            case AdminToolOptionsEnum.LEARNER_CONTEXT_TEST:
                return <AdminToolsLearnerContextTestOption option={option} />;
            case AdminToolOptionsEnum.SIGNING_AUTHORITY:
                return <AdminToolsSigningAuthorityOption option={option} />;
            case AdminToolOptionsEnum.NETWORKS:
                return <AdminToolsNetworkOption option={option} showFooter />;
            case AdminToolOptionsEnum.STORAGE:
                return <AdminToolsStorageOption option={option} showFooter />;
            case AdminToolOptionsEnum.BULK_UPLOAD:
                return <AdminToolsBulkBoostImportOption option={option} />;
            case AdminToolOptionsEnum.CONSENT_FLOW:
                return <AdminToolsConsentFlowOption option={option} />;
            case AdminToolOptionsEnum.SYNC_ALL_CREDENTIALS:
                return <AdminToolsSyncAllCredentialsOption option={option} />;
            case AdminToolOptionsEnum.CLI:
                return <AdminToolsCLIOption option={option} />;
            default:
                return null;
        }
    })();

    return (
        <div className="h-full relative bg-grayscale-100">
            <AdminToolsOptionsContainerHeader option={option} />
            <section className="h-full bg-grayscale-100 ion-padding overflow-y-scroll pb-[200px]">
                {adminToolContent}
            </section>
            <AdminToolsModalFooter />
        </div>
    );
};

export default AdminToolsOptionsContainer;
