import React, { useState } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('manage-data-sharing-modal');

import { IonSpinner } from '@ionic/react';
import {
    ChevronLeft,
    ChevronRight,
    Shield,
    Trash2,
    Settings,
    BookOpen,
    PenTool,
    ExternalLink,
    Activity,
} from 'lucide-react';
import { PaginatedConsentFlowTerms } from '@learncard/types';

import {
    useModal,
    ModalTypes,
    useWithdrawConsent,
    contractCategoryNameToCategoryMetadata,
    useWallet,
} from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import ConsentFlowPrivacyAndData from '../../pages/consentFlow/ConsentFlowPrivacyAndData';
import XApiDataFeedModal from './XApiDataFeedModal';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import * as m from '../../paraglide/messages.js';
import TransP from '../../i18n/TransP';

type ManageDataSharingModalProps = {
    onClose?: () => void;
};

const ManageDataSharingModal: React.FC<ManageDataSharingModalProps> = ({ onClose }) => {
    const { closeModal, newModal } = useModal();
    const { data: consentedContracts, isLoading, refetch } = useConsentedContracts();
    const brandingConfig = useBrandingConfig();

    const handleClose = () => {
        onClose?.();
        closeModal();
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-[20px] p-8 min-w-[350px] max-w-[450px]">
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                    <IonSpinner name="crescent" className="w-8 h-8 mb-4" />
                    <p className="text-grayscale-600">{m['dataSharing.loading']()}</p>
                </div>
            </div>
        );
    }

    const contracts = consentedContracts ?? [];

    return (
        <div className="bg-white rounded-[20px] p-6 min-w-[350px] max-w-[450px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={handleClose} className="p-1 -ml-1">
                    <ChevronLeft className="w-6 h-6 text-grayscale-700" />
                </button>

                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {m['dataSharing.title']()}
                    </h2>
                </div>
            </div>

            <p className="text-sm text-grayscale-600 mb-4">
                {m['dataSharing.subtitle']({ brand: brandingConfig?.name ?? '' })}
            </p>

            {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="w-12 h-12 text-grayscale-300 mb-4" />

                    <p className="text-grayscale-600 font-medium">
                        {m['dataSharing.empty.title']()}
                    </p>

                    <p className="text-sm text-grayscale-500 mt-1">
                        {m['dataSharing.empty.subtitle']()}
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto -mx-2 px-2">
                    <div className="flex flex-col gap-2">
                        {contracts.map(contract => (
                            <ConsentedContractRow
                                key={contract.uri}
                                contract={contract}
                                onUpdate={refetch}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-grayscale-100">
                <p className="text-xs text-grayscale-500 text-center">
                    {m['dataSharing.revokeHint']()}
                </p>
            </div>
        </div>
    );
};

type ConsentedContract = PaginatedConsentFlowTerms['records'][number];

type ConsentedContractRowProps = {
    contract: ConsentedContract;
    onUpdate?: () => void;
};

const ConsentedContractRow: React.FC<ConsentedContractRowProps> = ({ contract, onUpdate }) => {
    const { newModal, closeModal } = useModal();
    // Contract details are already in the record
    const contractDetails = contract.contract;

    const handleOpenDetails = () => {
        newModal(
            <ContractDetailView contract={contract} onUpdate={onUpdate} />,
            { sectionClassName: '!bg-transparent !shadow-none !max-w-[450px]' },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const name = contractDetails?.name ?? m['dataSharing.unknownApp']();
    const image = contractDetails?.image;

    // Count only accepted permissions (where sharing !== false)
    const acceptedReadCount = contract.terms?.read?.credentials?.categories
        ? Object.entries(contract.terms.read.credentials.categories).filter(([_, config]) => {
              const cfg = config as { sharing?: boolean };
              return cfg.sharing !== false;
          }).length
        : 0;

    const acceptedWriteCount = contract.terms?.write?.credentials?.categories
        ? Object.entries(contract.terms.write.credentials.categories).filter(([_, config]) => {
              if (typeof config === 'boolean') return config;
              const cfg = config as { sharing?: boolean };
              return cfg.sharing !== false;
          }).length
        : 0;

    const permissionParts: string[] = [];

    if (acceptedReadCount > 0) {
        permissionParts.push(m['dataSharing.readCount']({ count: acceptedReadCount }));
    }

    if (acceptedWriteCount > 0) {
        permissionParts.push(m['dataSharing.writeCount']({ count: acceptedWriteCount }));
    }

    const permissionText = permissionParts.length
        ? permissionParts.join(', ')
        : m['dataSharing.noPermissions']();

    return (
        <button
            onClick={handleOpenDetails}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-grayscale-50 transition-colors text-left w-full"
        >
            {image ? (
                <img src={image} alt={name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
                <div className="w-10 h-10 rounded-lg bg-grayscale-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-grayscale-400" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <p className="font-medium text-grayscale-900 truncate">{name}</p>
                <p className="text-sm text-grayscale-500 truncate">{permissionText}</p>
            </div>

            <ChevronRight className="w-5 h-5 text-grayscale-400 shrink-0" />
        </button>
    );
};

type ContractDetailViewProps = {
    contract: ConsentedContract;
    onUpdate?: () => void;
};

const ContractDetailView: React.FC<ContractDetailViewProps> = ({ contract, onUpdate }) => {
    const contractDetails = contract.contract;
    const { closeModal, closeAllModals, newModal } = useModal();
    const { initWallet } = useWallet();
    const brandingConfig = useBrandingConfig();

    const handleBack = () => {
        onUpdate?.(); // Refetch to show updated terms
        closeModal();
    };

    const { mutateAsync: withdrawConsent, isPending: isWithdrawing } = useWithdrawConsent(
        contract.uri
    );
    const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);
    const [isOpening, setIsOpening] = useState(false);

    const name = contractDetails?.name ?? m['dataSharing.unknownApp']();
    const image = contractDetails?.image;
    const redirectUrl = contractDetails?.redirectUrl?.trim();

    const handleEditPermissions = () => {
        if (!contractDetails || !contract.terms) return;

        newModal(
            <ConsentFlowPrivacyAndData
                contractDetails={contractDetails}
                terms={contract.terms}
                setTerms={() => {}} // Not used for direct updates - uses updateTerms internally
                isPostConsent={true}
                termsUri={contract.uri}
                ownerDid={contractDetails.owner?.did}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleViewDataFeed = () => {
        newModal(
            <XApiDataFeedModal
                contractUri={contract.uri}
                contractName={name}
                onBack={closeModal}
            />,
            { sectionClassName: '!p-0 !shadow-none' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleOpenApp = async () => {
        if (!redirectUrl) return;

        setIsOpening(true);

        try {
            const wallet = await initWallet();
            const urlObj = new URL(redirectUrl);

            // Add user's did to redirect url
            urlObj.searchParams.set('did', wallet.id.did());

            // Add delegate credential VP if contract has an owner
            if (contractDetails?.owner?.did) {
                const unsignedDelegateCredential = wallet.invoke.newCredential({
                    type: 'delegate',
                    subject: contractDetails.owner.did,
                    access: ['read', 'write'],
                });

                const delegateCredential = await wallet.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const unsignedDidAuthVp = await wallet.invoke.newPresentation(delegateCredential);

                const vp = (await wallet.invoke.issuePresentation(unsignedDidAuthVp, {
                    proofPurpose: 'authentication',
                    proofFormat: 'jwt',
                })) as any as string;

                urlObj.searchParams.set('vp', vp);
            }

            window.open(urlObj.toString(), '_blank');
        } catch (error) {
            log.error('Failed to open app:', error);
        } finally {
            setIsOpening(false);
        }
    };

    const handleRevoke = async () => {
        try {
            await withdrawConsent(contract.uri);
            onUpdate?.();
            closeAllModals();
        } catch (error) {
            log.error('Failed to revoke access:', error);
        }
    };

    if (showConfirmRevoke) {
        return (
            <div className="bg-white rounded-[20px] p-6 min-w-[350px] max-w-[400px]">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900">
                            {m['dataSharing.revokeConfirm.title']()}
                        </h3>

                        <p className="text-sm text-grayscale-600 mt-2">
                            <TransP
                                m={m['dataSharing.revokeConfirm.body']}
                                values={{ name, brand: brandingConfig?.name ?? '' }}
                                components={[<span className="font-medium" />]}
                            />
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full mt-2">
                        <button
                            onClick={handleRevoke}
                            disabled={isWithdrawing}
                            className="w-full py-3 bg-red-500 text-white rounded-full font-medium disabled:opacity-60"
                        >
                            {isWithdrawing
                                ? m['dataSharing.revoking']()
                                : m['dataSharing.confirmRevoke']()}
                        </button>

                        <button
                            onClick={() => setShowConfirmRevoke(false)}
                            disabled={isWithdrawing}
                            className="w-full py-3 bg-grayscale-100 text-grayscale-700 rounded-full font-medium disabled:opacity-60"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[20px] p-6 min-w-[350px] max-w-[450px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={handleBack} className="p-1 -ml-1">
                    <ChevronLeft className="w-6 h-6 text-grayscale-700" />
                </button>

                <span className="text-lg font-semibold text-grayscale-900">
                    {m['dataSharing.appDetails']()}
                </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
                {image ? (
                    <img src={image} alt={name} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-grayscale-100 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-grayscale-400" />
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold text-grayscale-900">{name}</h3>

                    {contractDetails?.description && (
                        <p className="text-sm text-grayscale-600 line-clamp-2">
                            {contractDetails.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
                <h4 className="text-sm font-semibold text-grayscale-700 mb-2">
                    {m['dataSharing.dataAccessPermissions']()}
                </h4>

                <div className="bg-grayscale-50 rounded-xl p-4">
                    <PermissionsList contract={contract} />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {redirectUrl && (
                    <button
                        onClick={handleOpenApp}
                        disabled={isOpening}
                        className="w-full py-3 bg-emerald-600 text-white rounded-full font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        <ExternalLink className="w-4 h-4" />
                        {isOpening ? m['dataSharing.opening']() : m['dataSharing.openApp']()}
                    </button>
                )}

                <button
                    onClick={handleViewDataFeed}
                    className="w-full py-3 bg-violet-100 text-violet-700 rounded-full font-medium flex items-center justify-center gap-2"
                >
                    <Activity className="w-4 h-4" />
                    {m['dataSharing.xapiDataFeed']()}
                </button>

                <button
                    onClick={handleEditPermissions}
                    className="w-full py-3 bg-grayscale-100 text-grayscale-700 rounded-full font-medium flex items-center justify-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    {m['dataSharing.editPermissions']()}
                </button>

                <button
                    onClick={() => setShowConfirmRevoke(true)}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-full font-medium flex items-center justify-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    {m['dataSharing.revokeAccess']()}
                </button>
            </div>
        </div>
    );
};

const PermissionsList: React.FC<{ contract: ConsentedContract }> = ({ contract }) => {
    // Filter to only show categories where sharing is enabled (matching AppInstallConsentModal logic)
    const acceptedReadCategories = contract.terms?.read?.credentials?.categories
        ? Object.entries(contract.terms.read.credentials.categories)
              .filter(([_, config]) => {
                  const cfg = config as { sharing?: boolean };
                  return cfg.sharing !== false;
              })
              .map(([category]) => category)
        : [];

    const acceptedWriteCategories = contract.terms?.write?.credentials?.categories
        ? Object.entries(contract.terms.write.credentials.categories)
              .filter(([_, config]) => {
                  if (typeof config === 'boolean') return config;
                  const cfg = config as { sharing?: boolean };
                  return cfg.sharing !== false;
              })
              .map(([category]) => category)
        : [];

    const hasReadCategories = acceptedReadCategories.length > 0;
    const hasWriteCategories = acceptedWriteCategories.length > 0;

    if (!hasReadCategories && !hasWriteCategories) {
        return (
            <p className="text-sm text-grayscale-500 italic">
                {m['dataSharing.noDataPermissions']()}
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Read Permissions */}
            <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-medium text-cyan-700">
                        {m['dataSharing.readAccess']()}
                    </span>
                </div>

                {hasReadCategories ? (
                    <div className="flex flex-wrap gap-1.5">
                        {acceptedReadCategories.map(category => {
                            const metadata = contractCategoryNameToCategoryMetadata(category);
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
                        {m['dataSharing.noReadPermissions']()}
                    </p>
                )}
            </div>

            {/* Write Permissions */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                    <PenTool className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                        {m['dataSharing.writeAccess']()}
                    </span>
                </div>

                {hasWriteCategories ? (
                    <div className="flex flex-wrap gap-1.5">
                        {acceptedWriteCategories.map(category => {
                            const metadata = contractCategoryNameToCategoryMetadata(category);
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
                        {m['dataSharing.noWritePermissions']()}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ManageDataSharingModal;
