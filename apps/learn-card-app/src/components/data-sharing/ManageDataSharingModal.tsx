import React, { useEffect, useRef, useState } from 'react';
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
    LEARNCARD_AI_PASSPORT_CONTRACT_URI,
    contractCategoryNameToCategoryMetadata,
    useWallet,
} from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import ConsentFlowPrivacyAndData from '../../pages/consentFlow/ConsentFlowPrivacyAndData';
import XApiDataFeedModal from './XApiDataFeedModal';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import { useAiConsentToggle } from '../../hooks/useAiConsentToggle';
import * as m from '../../paraglide/messages.js';
import TransP from '../../i18n/TransP';
import { buildPermissionText } from './consentSummary';

type ManageDataSharingModalProps = {
    onClose?: () => void;
};

type RevokeAccessConfirmationModalProps = {
    name: string;
    brandName: string;
    isLearnCardAiContract: boolean;
    isWorking: boolean;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
};

const RevokeAccessConfirmationModal: React.FC<RevokeAccessConfirmationModalProps> = ({
    name,
    brandName,
    isLearnCardAiContract,
    isWorking,
    onConfirm,
    onCancel,
}) => {
    const { closeModal } = useModal();
    const [isRevoking, setIsRevoking] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleConfirm = async () => {
        setIsRevoking(true);

        try {
            await onConfirm();
        } finally {
            if (isMountedRef.current) {
                setIsRevoking(false);
            }
        }
    };

    const handleCancel = () => {
        onCancel();
        closeModal();
    };

    return (
        <div className="bg-white rounded-[20px] p-6 min-w-[350px] max-w-[400px]">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-red-500" />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-grayscale-900">
                        {isLearnCardAiContract
                            ? m['dataSharing.revokeConfirm.aiTitle']()
                            : m['dataSharing.revokeConfirm.title']()}
                    </h3>

                    <p className="text-sm text-grayscale-600 mt-2 leading-relaxed">
                        {isLearnCardAiContract ? (
                            <>{m['dataSharing.revokeConfirm.aiBody']()}</>
                        ) : (
                            <TransP
                                m={m['dataSharing.revokeConfirm.body']}
                                values={{ name, brand: brandName }}
                                components={[<span className="font-medium" />]}
                            />
                        )}
                    </p>
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                    <button
                        onClick={handleConfirm}
                        disabled={isRevoking || isWorking}
                        className="w-full py-3 bg-red-500 text-white rounded-full font-medium disabled:opacity-60"
                    >
                        {isRevoking || isWorking
                            ? m['dataSharing.revoking']()
                            : isLearnCardAiContract
                              ? m['dataSharing.disableAiRevoke']()
                              : m['dataSharing.confirmRevoke']()}
                    </button>

                    <button
                        onClick={handleCancel}
                        disabled={isRevoking || isWorking}
                        className="w-full py-3 bg-grayscale-100 text-grayscale-700 rounded-full font-medium disabled:opacity-60"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
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

    const contracts = [...(consentedContracts ?? [])]
        .filter(contract => contract?.status !== 'withdrawn')
        .sort((a, b) => {
            const aUpdatedAt = new Date(a.terms?.updatedAt ?? a.contract?.updatedAt ?? 0).getTime();
            const bUpdatedAt = new Date(b.terms?.updatedAt ?? b.contract?.updatedAt ?? 0).getTime();

            return bUpdatedAt - aUpdatedAt;
        });

    return (
        <div className="bg-white rounded-[20px] min-w-[350px] max-w-[450px] w-full h-full overflow-hidden flex flex-col min-h-0">
            <div className="shrink-0 p-6 pb-4">
                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={handleClose}
                        className="p-1 -ml-1"
                        aria-label={m['common.back']()}
                    >
                        <ChevronLeft className="w-6 h-6 text-grayscale-700" />
                    </button>

                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-emerald-600" />
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            {m['dataSharing.title']()}
                        </h2>
                    </div>
                </div>

                <p className="text-sm text-grayscale-600">
                    Apps and services you've given permission to access your {brandingConfig?.name}{' '}
                    data.
                </p>
            </div>

            {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 pt-4 pb-10 text-center">
                    <Shield className="w-12 h-12 text-grayscale-300 mb-4" />

                    <p className="text-grayscale-600 font-medium">
                        {m['dataSharing.empty.title']()}
                    </p>

                    <p className="text-sm text-grayscale-500 mt-1">
                        {m['dataSharing.empty.subtitle']()}
                    </p>
                </div>
            ) : (
                <>
                    <div className="modal-scrollable flex-1 min-h-0 overflow-y-auto px-4">
                        <div className="flex flex-col gap-1 py-1">
                            {contracts.map(contract => (
                                <ConsentedContractRow
                                    key={contract.uri}
                                    contract={contract}
                                    onUpdate={refetch}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="shrink-0 px-6 py-4 border-t border-grayscale-100">
                        <p className="text-xs text-grayscale-500 text-center">
                            {m['dataSharing.revokeHint']()}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export type ConsentedContract = PaginatedConsentFlowTerms['records'][number];

type ConsentedContractRowProps = {
    contract: ConsentedContract;
    onUpdate?: () => Promise<unknown> | void;
};

export const ConsentedContractRow: React.FC<ConsentedContractRowProps> = ({
    contract,
    onUpdate,
}) => {
    const { newModal, closeModal } = useModal();
    // Contract details are already in the record
    const contractDetails = contract.contract;

    const handleOpenDetails = () => {
        void (async () => {
            try {
                const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
                await Haptics.impact({ style: ImpactStyle.Light });
            } catch (e) {
                log.debug('haptics unavailable', e);
            }
        })();

        newModal(
            <ContractDetailView contract={contract} onUpdate={onUpdate} />,
            {
                sectionClassName:
                    '!bg-transparent !shadow-none !max-w-[450px] !h-[80vh] !max-h-[80vh] !overflow-hidden',
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const name = contractDetails?.name ?? m['dataSharing.unknownApp']();
    const image = contractDetails?.image;

    const permissionText = buildPermissionText(contract);

    return (
        <button
            onClick={handleOpenDetails}
            className="flex items-center gap-3 p-3 min-h-[64px] rounded-xl hover:bg-grayscale-10 transition-all duration-100 motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-left w-full"
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
    onUpdate?: () => Promise<unknown> | void;
};

export const ContractDetailView: React.FC<ContractDetailViewProps> = ({ contract, onUpdate }) => {
    const contractDetails = contract.contract;
    const { closeModal, newModal } = useModal();
    const { initWallet } = useWallet();
    const { handleAiToggle } = useAiConsentToggle();
    const { name: brandName } = useBrandingConfig();
    const contractUri = contractDetails?.uri ?? contract.uri;
    const [step, setStep] = useState<'details' | 'edit' | 'activity'>('details');

    const handleBack = () => {
        if (step !== 'details') {
            void onUpdate?.();
            setStep('details');
            return;
        }
        void onUpdate?.();
        closeModal();
    };

    const { mutateAsync: withdrawConsent, isPending: isWithdrawing } = useWithdrawConsent(
        contract.uri
    );
    const [isOpening, setIsOpening] = useState(false);
    const isLearnCardAiContract = contractUri === LEARNCARD_AI_PASSPORT_CONTRACT_URI;

    const name = contractDetails?.name ?? m['dataSharing.unknownApp']();
    const image = contractDetails?.image;
    const redirectUrl = contractDetails?.redirectUrl?.trim();

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
            if (isLearnCardAiContract) {
                const revoked = await handleAiToggle(false);
                if (!revoked) return;

                await onUpdate?.();
                closeModal();
                closeModal();
                return;
            }

            await withdrawConsent(contract.uri);
            await onUpdate?.();
            closeModal();
            closeModal();
        } catch (error) {
            log.error('Failed to revoke access:', error);
        }
    };

    const openRevokeConfirmation = () => {
        newModal(
            <RevokeAccessConfirmationModal
                name={name}
                brandName={brandName}
                isLearnCardAiContract={isLearnCardAiContract}
                onConfirm={handleRevoke}
                onCancel={closeModal}
                isWorking={isWithdrawing}
            />,
            {
                sectionClassName:
                    '!bg-transparent !shadow-none !max-w-[400px] !w-[400px] !overflow-hidden',
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const stepTitle =
        step === 'edit'
            ? m['dataSharing.editAccess']()
            : step === 'activity'
              ? m['dataSharing.activityFeed']()
              : m['dataSharing.appDetails']();

    return (
        <div className="bg-white rounded-[20px] min-w-[350px] max-w-[450px] w-full h-[80vh] overflow-hidden flex flex-col min-h-0">
            <div className="shrink-0 flex items-center gap-3 px-6 pt-6 pb-4">
                <button
                    onClick={handleBack}
                    aria-label={m['common.back']()}
                    className="p-1 -ml-1 rounded-full hover:bg-grayscale-10 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-grayscale-700" />
                </button>

                {image ? (
                    <img src={image} alt={name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-grayscale-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-grayscale-400" />
                    </div>
                )}

                <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-grayscale-900 truncate leading-tight">
                        {stepTitle}
                    </h2>
                    <p className="text-xs text-grayscale-500 truncate">{name}</p>
                </div>
            </div>

            {step === 'details' && (
                <>
                    <div className="flex-1 min-h-0 overflow-y-auto px-6">
                        {contractDetails?.description && (
                            <p className="text-sm text-grayscale-600 leading-relaxed mb-5">
                                {contractDetails.description}
                            </p>
                        )}

                        <h4 className="text-xs font-semibold tracking-wider text-grayscale-500 uppercase mb-2">
                            {m['dataSharing.dataAccess']()}
                        </h4>

                        <div className="bg-grayscale-50 rounded-xl p-4">
                            <PermissionsList contract={contract} />
                        </div>
                    </div>

                    <div className="shrink-0 flex flex-col gap-2.5 px-6 py-5 border-t border-grayscale-100">
                        {redirectUrl && (
                            <button
                                onClick={handleOpenApp}
                                disabled={isOpening}
                                className="w-full py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                <ExternalLink className="w-4 h-4" />
                                {isOpening
                                    ? m['dataSharing.opening']()
                                    : m['dataSharing.openApp']()}
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                onClick={() => setStep('edit')}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                {m['dataSharing.editAccess']()}
                            </button>

                            <button
                                onClick={() => setStep('activity')}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Activity className="w-4 h-4" />
                                {m['dataSharing.activityFeed']()}
                            </button>
                        </div>

                        <button
                            onClick={openRevokeConfirmation}
                            className="w-full py-3 px-4 rounded-[20px] text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            {m['dataSharing.revokeAccess']()}
                        </button>
                    </div>
                </>
            )}

            {step === 'edit' && contractDetails && contract.terms && (
                <div className="relative flex-1 min-h-0">
                    <ConsentFlowPrivacyAndData
                        contractDetails={contractDetails}
                        terms={contract.terms}
                        setTerms={() => {}}
                        isPostConsent
                        embedded
                        termsUri={contract.uri}
                        ownerDid={contractDetails.owner?.did}
                        onSaved={() => {
                            void onUpdate?.();
                            setStep('details');
                        }}
                        onCancel={() => setStep('details')}
                    />
                </div>
            )}

            {step === 'activity' && (
                <div className="flex-1 min-h-0">
                    <XApiDataFeedModal contractUri={contract.uri} contractName={name} embedded />
                </div>
            )}
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
