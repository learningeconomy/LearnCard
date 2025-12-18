import React from 'react';
import { useHistory } from 'react-router-dom';

import AdminPageStructure from './AdminPageStructure';

import { useModal } from 'learn-card-base';
import {
    adminToolOptions,
    AdminToolOptionsEnum,
    developerToolOptions,
} from './AdminToolsModal/admin-tools.helpers';
import { ModalTypes, useGetCredentialsForSkills, useToast } from 'learn-card-base';
import AdminToolsOptionsContainer from './AdminToolsModal/AdminToolsOptionsContainer';

const AdminToolsPage: React.FC = () => {
    const history = useHistory();
    const { presentToast } = useToast();
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });

    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedCredsLoading,
        error: allResolvedCredsError,
        refetch,
    } = useGetCredentialsForSkills();

    const handleExportVCs = () => {
        if (allResolvedCredsError) {
            presentToast('Error loading credentials. Please try again.');
            return;
        }

        if (!allResolvedCreds || allResolvedCreds.length === 0) {
            presentToast('There are no VCs to export.');
            return;
        }

        const blob = new Blob([JSON.stringify(allResolvedCreds, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'vcs.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <AdminPageStructure title="What you would you like to do, O Admin?" hideBackButton>
            <section className="flex flex-col gap-[20px]">
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() => history.push('/admin-tools/view-managed-boosts')}
                >
                    View All Managed Boosts
                </button>
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() =>
                        newModal(
                            <AdminToolsOptionsContainer
                                option={
                                    adminToolOptions.find(
                                        option => option.type === AdminToolOptionsEnum.BULK_UPLOAD
                                    )!
                                }
                            />
                        )
                    }
                >
                    Bulk Import Boosts
                </button>
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() => history.push('/admin-tools/service-profiles')}
                >
                    Manage Service Profiles
                </button>
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() =>
                        newModal(
                            <AdminToolsOptionsContainer
                                option={
                                    adminToolOptions.find(
                                        option => option.type === AdminToolOptionsEnum.CONSENT_FLOW
                                    )!
                                }
                            />
                        )
                    }
                >
                    Manage ConsentFlow Contracts
                </button>
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() =>
                        newModal(
                            <AdminToolsOptionsContainer
                                option={
                                    developerToolOptions.find(
                                        option => option.type === AdminToolOptionsEnum.API_TOKENS
                                    )!
                                }
                            />
                        )
                    }
                >
                    API Tokens
                </button>
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() =>
                        newModal(
                            <AdminToolsOptionsContainer
                                option={
                                    developerToolOptions.find(
                                        option =>
                                            option.type === AdminToolOptionsEnum.SIGNING_AUTHORITY
                                    )!
                                }
                            />
                        )
                    }
                >
                    Signing Authorities
                </button>
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px] disabled:opacity-50"
                    onClick={() => handleExportVCs()}
                    disabled={credentialsFetching || allResolvedCredsLoading}
                >
                    {credentialsFetching || allResolvedCredsLoading
                        ? 'Fetching VCs to Export...'
                        : 'Export VCs'}
                </button>
            </section>
        </AdminPageStructure>
    );
};

export default AdminToolsPage;
