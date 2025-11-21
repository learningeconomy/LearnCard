import React from 'react';

import AdminToolsModalFooter from './AdminToolsModalFooter';
// import AdminToolsNetworkOption from '../AdminToolsNetwork/AdminToolsNetwork';
// import AdminToolsApiTokensOption from '../api-tokens/AdminToolsApiTokensOption';
import AdminToolsOptionsContainerHeader from './AdminToolsOptionsContainerHeader';
// import AdminToolsStorageOption from '../AdminToolsStorage/AdminToolsStorageOption';
import AdminToolsBulkBoostImportOption from '../bulk-import/AdminToolsBulkBoostImportOption';
// import AdminToolsConsentFlowOption from '../AdminToolsConsentFlow/AdminToolsConsentFlowOption';
// import AdminToolsSigningAuthorityOption from '../signingAuthority/AdminToolsSigningAuthorityOption';
import SkillFrameworks from '../../SkillFrameworks/SkillFrameworks';
import ManageSkills from '../../SkillFrameworks/ManageSkills';
import ViewSkillFramework from '../../SkillFrameworks/ViewSkillFramework';

import { AdminToolOption, AdminToolOptionsEnum } from './admin-tools.helpers';

export const AdminToolsOptionsContainer: React.FC<{ option: AdminToolOption }> = ({ option }) => {
    let activeAdminToolOption: AdminToolOptionsEnum = option.type;

    let adminToolContent: React.ReactNode = null;

    switch (activeAdminToolOption) {
        // case AdminToolOptionsEnum.API_TOKENS:
        //     adminToolContent = <AdminToolsApiTokensOption option={option} />;
        //     break;
        // case AdminToolOptionsEnum.SIGNING_AUTHORITY:
        //     adminToolContent = <AdminToolsSigningAuthorityOption option={option} />;
        //     break;
        // case AdminToolOptionsEnum.NETWORKS:
        //     adminToolContent = <AdminToolsNetworkOption option={option} showFooter />;
        //     break;
        // case AdminToolOptionsEnum.STORAGE:
        //     adminToolContent = <AdminToolsStorageOption option={option} showFooter />;
        //     break;
        case AdminToolOptionsEnum.BULK_UPLOAD:
            adminToolContent = <AdminToolsBulkBoostImportOption option={option} />;
            break;
        // case AdminToolOptionsEnum.CONSENT_FLOW:
        //     adminToolContent = <AdminToolsConsentFlowOption option={option} />;
        //     break;
        case AdminToolOptionsEnum.SKILL_FRAMEWORKS:
            adminToolContent = <SkillFrameworks />;
            break;
        case AdminToolOptionsEnum.IMPORT_SKILL_FRAMEWORKS:
            adminToolContent = <ManageSkills />;
            break;
        default:
            adminToolContent = null;
            break;
    }

    return (
        <div className="h-full relative bg-grayscale-100">
            <AdminToolsOptionsContainerHeader option={option} />
            <section className="h-full bg-grayscale-100 pt-[30px] px-[20px] pb-[200px] overflow-y-auto z-0">
                {adminToolContent}
            </section>
            <AdminToolsModalFooter footerTextOverride={option.footerTextOverride} />
        </div>
    );
};

export default AdminToolsOptionsContainer;
