import React, { useState, useEffect, useCallback } from 'react';
import { useImmer, Updater } from 'use-immer';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, PenTool, Settings, Loader2 } from 'lucide-react';

import {
    useModal,
    useWallet,
    useCurrentUser,
    useConsentToContract,
    useSyncConsentFlow,
    contractCategoryNameToCategoryMetadata,
    ModalTypes,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import type { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import ConsentFlowPrivacyAndData from '../../pages/consentFlow/ConsentFlowPrivacyAndData';
import { getMinimumTermsForContract } from '../../helpers/contract.helpers';

// Permission types matching the app-store-portal
type AppPermission =
    | 'request_identity'
    | 'send_credential'
    | 'launch_feature'
    | 'credential_search'
    | 'credential_by_id'
    | 'request_consent'
    | 'template_issuance';

const PERMISSION_INFO: Record<AppPermission, { label: string; description: string }> = {
    request_identity: {
        label: 'Request Identity',
        description: 'View your profile information and verify your identity',
    },
    send_credential: {
        label: 'Send Credentials',
        description: 'Send verifiable credentials to your wallet',
    },
    launch_feature: {
        label: 'Launch Features',
        description: 'Open wallet features programmatically',
    },
    credential_search: {
        label: 'Search Credentials',
        description: 'Search through your stored credentials',
    },
    credential_by_id: {
        label: 'Access Credentials',
        description: 'Retrieve specific credentials by their ID',
    },
    request_consent: {
        label: 'Request Consent',
        description: 'Ask for your consent to access or share data',
    },
    template_issuance: {
        label: 'Issue Credentials',
        description: 'Create and issue credentials from templates',
    },
};

type AppInstallConsentModalProps = {
    appName: string;
    appIcon?: string;
    permissions: string[];
    contractUri?: string;
    onAccept: () => void;
    onReject: () => void;
    isPreview?: boolean;
};

export const AppInstallConsentModal: React.FC<AppInstallConsentModalProps> = ({
    appName,
    appIcon,
    permissions,
    contractUri,
    onAccept,
    onReject,
    isPreview = false,
}) => {
    const { newModal } = useModal();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const currentUser = useCurrentUser();
    const [isConsenting, setIsConsenting] = useState(false);

    // Filter to only known permissions
    const validPermissions = permissions.filter((p): p is AppPermission => p in PERMISSION_INFO);

    // Fetch contract details if contractUri is provided
    const { data: contractDetails, isLoading: isLoadingContract } =
        useQuery<ConsentFlowContractDetails | null>({
            queryKey: ['getContract', contractUri],
            queryFn: async () => {
                if (!contractUri) return null;
                try {
                    const wallet = await initWallet();
                    return await wallet.invoke.getContract(contractUri);
                } catch (error) {
                    console.error('Failed to fetch contract:', error);
                    return null;
                }
            },
            enabled: !!contractUri,
        });

    // Initialize terms when contract is loaded
    const [terms, setTerms] = useImmer<ConsentFlowTerms | null>(null);

    useEffect(() => {
        if (contractDetails?.contract && currentUser) {
            setTerms(getMinimumTermsForContract(contractDetails.contract, currentUser));
        }
    }, [contractDetails, currentUser]);

    // Consent mutation
    const { mutateAsync: consentToContract } = useConsentToContract(
        contractUri ?? '',
        contractDetails?.owner?.did ?? ''
    );
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    // Contract permissions display - show what the user has actually accepted in their terms
    // Filter to only show categories where sharing is enabled
    const acceptedReadCategories = terms?.read?.credentials?.categories
        ? Object.entries(terms.read.credentials.categories)
              .filter(([_, config]) => {
                  const cfg = config as { sharing?: boolean };
                  return cfg.sharing !== false;
              })
              .map(([category]) => category)
        : [];

    const acceptedWriteCategories = terms?.write?.credentials?.categories
        ? Object.entries(terms.write.credentials.categories)
              .filter(([_, config]) => {
                  // Write categories can be boolean or object with sharing property
                  if (typeof config === 'boolean') return config;
                  const cfg = config as { sharing?: boolean };
                  return cfg.sharing !== false;
              })
              .map(([category]) => category)
        : [];

    const hasReadCategories = acceptedReadCategories.length > 0;
    const hasWriteCategories = acceptedWriteCategories.length > 0;
    const hasAnyDataPermissions =
        contractUri && contractDetails && (hasReadCategories || hasWriteCategories);

    // Wrapper to adapt setTerms type for ConsentFlowPrivacyAndData
    // ConsentFlowPrivacyAndData expects Updater<ConsentFlowTerms> but our state is ConsentFlowTerms | null
    const setTermsWrapper: Updater<ConsentFlowTerms> = useCallback(
        updater => {
            setTerms(draft => {
                if (draft === null) return;

                if (typeof updater === 'function') {
                    updater(draft);
                } else {
                    return updater;
                }
            });
        },
        [setTerms]
    );

    const openPrivacyAndData = () => {
        if (!contractDetails || !terms) return;

        newModal(
            <ConsentFlowPrivacyAndData
                contractDetails={contractDetails}
                terms={terms}
                setTerms={setTermsWrapper}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleInstall = async () => {
        // If there's a contract, consent to it first
        if (contractUri && contractDetails && terms) {
            setIsConsenting(true);

            try {
                await consentToContract({
                    terms,
                    expiresAt: undefined,
                    oneTime: false,
                });

                // Sync any auto-boost credentials
                fetchNewContractCredentials();
            } catch (error: any) {
                // If the user has already consented, ignore the error
                const isAlreadyConsented =
                    error?.data?.code === 'CONFLICT' ||
                    error?.shape?.code === 'CONFLICT' ||
                    error?.message?.includes('already consented');

                if (!isAlreadyConsented) {
                    setIsConsenting(false);
                    presentToast('Unable to install app, please try again.', {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                    return;
                }
            }

            setIsConsenting(false);
        }

        // Proceed with the install
        onAccept();
    };

    return (
        <div className="flex flex-col h-full w-full bg-white max-w-[500px] mx-auto">
            {/* Header */}
            <div
                className="border-b border-grayscale-200 p-6"
                style={{
                    paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
                }}
            >
                <h2 className="text-2xl font-bold text-grayscale-900 text-center">Install App</h2>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* App Icon */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-grayscale-100 flex items-center justify-center shadow-md">
                        {appIcon ? (
                            <img
                                src={appIcon}
                                alt={appName}
                                className="w-full h-full object-cover"
                                onError={e => {
                                    (e.target as HTMLImageElement).src =
                                        'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                                }}
                            />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-grayscale-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        )}
                    </div>

                    {/* App Info */}
                    <div>
                        <p className="text-lg font-semibold text-grayscale-900 mb-1">
                            Install <span className="font-bold">{appName}</span>?
                        </p>

                        <p className="text-sm text-grayscale-600">
                            This app is requesting the following permissions
                        </p>
                    </div>

                    {/* Permissions List */}
                    {validPermissions.length > 0 ? (
                        <div className="bg-grayscale-50 rounded-lg p-4 w-full text-left">
                            <p className="text-sm font-semibold text-grayscale-900 mb-3">
                                This app will be able to:
                            </p>

                            <ul className="space-y-3">
                                {validPermissions.map(permission => {
                                    const info = PERMISSION_INFO[permission];

                                    return (
                                        <li key={permission} className="flex items-start text-sm">
                                            <svg
                                                className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                />
                                            </svg>

                                            <div>
                                                <span className="font-medium text-grayscale-900">
                                                    {info.label}
                                                </span>

                                                <p className="text-grayscale-600 text-xs mt-0.5">
                                                    {info.description}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : !hasAnyDataPermissions ? (
                        <div className="bg-green-50 rounded-lg p-4 w-full text-left">
                            <div className="flex items-center text-sm text-green-800">
                                <svg
                                    className="h-5 w-5 text-green-600 mr-2 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>

                                <span>This app doesn't require any special permissions.</span>
                            </div>
                        </div>
                    ) : null}

                    {/* Consent Flow Contract Permissions */}
                    {contractUri && (
                        <div className="w-full">
                            {isLoadingContract ? (
                                <div className="bg-grayscale-50 rounded-lg p-4 flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-grayscale-400" />
                                    <span className="text-sm text-grayscale-500">
                                        Loading data permissions...
                                    </span>
                                </div>
                            ) : contractDetails ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-grayscale-900">
                                            Data Access Permissions
                                        </p>

                                        <button
                                            onClick={openPrivacyAndData}
                                            disabled={!terms}
                                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                    </div>

                                    {/* Read Permissions */}
                                    <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-3 text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="w-4 h-4 text-cyan-600" />
                                            <span className="text-xs font-medium text-cyan-700">
                                                Read Access
                                            </span>
                                        </div>

                                        {hasReadCategories ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {acceptedReadCategories.map(category => {
                                                    const metadata =
                                                        contractCategoryNameToCategoryMetadata(
                                                            category
                                                        );
                                                    return (
                                                        <span
                                                            key={category}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white text-cyan-700 rounded-full text-xs font-medium border border-cyan-200"
                                                        >
                                                            {metadata?.IconWithShape && (
                                                                <metadata.IconWithShape className="w-3.5 h-3.5" />
                                                            )}
                                                            {metadata?.title || category}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-cyan-600 italic">
                                                No read permissions requested
                                            </p>
                                        )}
                                    </div>

                                    {/* Write Permissions */}
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <PenTool className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs font-medium text-emerald-700">
                                                Write Access
                                            </span>
                                        </div>

                                        {hasWriteCategories ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {acceptedWriteCategories.map(category => {
                                                    const metadata =
                                                        contractCategoryNameToCategoryMetadata(
                                                            category
                                                        );
                                                    return (
                                                        <span
                                                            key={category}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
                                                        >
                                                            {metadata?.IconWithShape && (
                                                                <metadata.IconWithShape className="w-3.5 h-3.5" />
                                                            )}
                                                            {metadata?.title || category}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-emerald-600 italic">
                                                No write permissions requested
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50 rounded-lg p-3 text-left">
                                    <p className="text-xs text-amber-700">
                                        Unable to load data permissions for this app.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Privacy Note */}
                    <p className="text-xs text-grayscale-500 italic">
                        You can uninstall this app at any time from your installed apps.
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div
                className="flex items-center justify-center gap-4 p-6 border-t border-grayscale-200 bg-white"
                style={{
                    paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
                    paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
                    paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
                }}
            >
                <button
                    onClick={onReject}
                    disabled={isConsenting}
                    className="px-8 py-3 text-lg font-semibold text-grayscale-700 bg-grayscale-100 rounded-full hover:bg-grayscale-200 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>

                <button
                    onClick={handleInstall}
                    disabled={isPreview || isConsenting || (!!contractUri && isLoadingContract)}
                    className={`px-8 py-3 text-lg font-semibold text-white rounded-full transition-colors disabled:opacity-50 flex items-center gap-2 ${
                        isPreview
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                    title={isPreview ? 'Install is disabled in preview mode' : undefined}
                >
                    {isConsenting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isPreview ? 'Preview Only' : isConsenting ? 'Connecting...' : 'Install'}
                </button>
            </div>
        </div>
    );
};

export default AppInstallConsentModal;
