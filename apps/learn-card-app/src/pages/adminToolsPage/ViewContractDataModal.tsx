import React from 'react';

import { IonSpinner } from '@ionic/react';
import { ConsentFlowContractDetails } from '@learncard/types';
import { useContract, useGetConsentFlowData, useModal } from 'learn-card-base';

import Share from '../../components/svgs/Share';
import CreateContractModal from './CreateContractModal';
import ShareContractModal from './ShareContractModal';

type ViewContractDataModalProps = {
    contract: ConsentFlowContractDetails;
    onCreateSuccess?: (contractUri?: string) => void;
};

type EntryConfig = {
    required: boolean;
    defaultEnabled?: boolean;
};

const renderEntryChips = (entries: Record<string, EntryConfig> | undefined, emptyLabel: string) => {
    const entryList = Object.entries(entries ?? {});

    if (!entryList.length) {
        return <p className="text-sm text-grayscale-400">{emptyLabel}</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {entryList.map(([key, config]) => (
                <div
                    key={key}
                    className="flex flex-col gap-0.5 rounded-[16px] border border-grayscale-200 bg-white px-3 py-2"
                >
                    <span className="text-sm font-medium text-grayscale-900">{key}</span>
                    <span className="text-xs text-grayscale-500">
                        {config.required ? 'Required' : 'Optional'}
                        {config.defaultEnabled !== undefined
                            ? ` · Default ${config.defaultEnabled ? 'on' : 'off'}`
                            : ''}
                    </span>
                </div>
            ))}
        </div>
    );
};

const renderStringChips = (values: string[] | undefined, emptyLabel: string) => {
    if (!values?.length) {
        return <p className="text-sm text-grayscale-400">{emptyLabel}</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {values.map(value => (
                <span
                    key={value}
                    className="rounded-[16px] border border-grayscale-200 bg-white px-3 py-2 text-sm text-grayscale-700"
                >
                    {value}
                </span>
            ))}
        </div>
    );
};

const renderProfileChips = (
    values: ConsentFlowContractDetails['writers'] | undefined,
    emptyLabel: string
) => {
    if (!values?.length) {
        return <p className="text-sm text-grayscale-400">{emptyLabel}</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {values.map(profile => (
                <span
                    key={profile.did}
                    className="rounded-[16px] border border-grayscale-200 bg-white px-3 py-2 text-sm text-grayscale-700"
                >
                    {profile.profileId ?? profile.displayName ?? profile.did}
                </span>
            ))}
        </div>
    );
};

const ViewContractDataModal: React.FC<ViewContractDataModalProps> = ({
    contract,
    onCreateSuccess,
}) => {
    const { newModal, closeModal } = useModal();
    const { data: contractDetails, isLoading: contractLoading } = useContract(contract.uri);
    const resolvedContract = contractDetails ?? contract;

    const { data: paginatedData, isLoading: consentDataLoading } = useGetConsentFlowData(
        resolvedContract.uri
    );
    const data = paginatedData?.records;

    const {
        name,
        image,
        uri,
        owner,
        subtitle,
        description,
        reasonForAccessing,
        createdAt,
        updatedAt,
        expiresAt,
        needsGuardianConsent,
        redirectUrl,
        frontDoorBoostUri,
        autoBoosts,
        writers,
        contract: contractDefinition,
    } = resolvedContract;

    const openShareContractModal = (contractToShare: ConsentFlowContractDetails) => {
        newModal(<ShareContractModal contract={contractToShare} />, {
            sectionClassName: '!max-w-[500px]',
        });
    };

    const openCreateFromTemplateModal = () => {
        closeModal();

        window.setTimeout(() => {
            newModal(
                <CreateContractModal
                    templateContract={resolvedContract}
                    onSuccess={onCreateSuccess}
                />,
                {
                    sectionClassName: '!max-w-[1000px]',
                }
            );
        }, 0);
    };

    return (
        <section className="text-grayscale-900 h-full w-full px-[24px] py-[28px] min-h-[300px] space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                    {image ? (
                        <img
                            src={image}
                            alt={`${name} icon`}
                            className="h-[72px] w-[72px] rounded-full object-cover border border-grayscale-200 bg-white shrink-0"
                        />
                    ) : (
                        <div className="h-[72px] w-[72px] rounded-full border border-grayscale-200 bg-grayscale-100 shrink-0" />
                    )}

                    <div className="min-w-0 space-y-1">
                        <h1 className="text-xl font-semibold text-grayscale-900 line-clamp-2">
                            {name}
                        </h1>
                        {subtitle && <p className="text-sm text-grayscale-600">{subtitle}</p>}
                        {description && (
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            openShareContractModal(resolvedContract);
                        }}
                        className="h-[40px] w-[40px] rounded-[20px] border border-grayscale-300 bg-white flex items-center justify-center hover:bg-grayscale-10 transition-colors"
                        aria-label="Share contract"
                    >
                        <Share className="h-[22px] w-[22px] text-grayscale-700" />
                    </button>
                    <button
                        onClick={openCreateFromTemplateModal}
                        className="py-2.5 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        Create from template
                    </button>
                </div>
            </div>

            {contractLoading && (
                <div className="w-full h-[120px] flex flex-col gap-[5px] items-center justify-center rounded-[20px] border border-grayscale-200 bg-grayscale-10">
                    <IonSpinner color="dark" />
                    <span className="text-sm text-grayscale-600">Loading contract...</span>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[20px] border border-grayscale-200 bg-grayscale-10 p-4 space-y-3">
                    <h2 className="text-lg font-semibold text-grayscale-900">Contract Details</h2>
                    <div className="space-y-2 text-sm text-grayscale-700">
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Owner
                            </p>
                            <p className="text-grayscale-900">
                                {owner?.displayName ?? owner?.profileId ?? 'Unknown owner'}
                            </p>
                            <p className="text-xs text-grayscale-500 break-all">{owner?.did}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Contract URI
                            </p>
                            <p className="text-xs text-grayscale-700 break-all">{uri}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                    Created
                                </p>
                                <p className="text-grayscale-900">{createdAt}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                    Updated
                                </p>
                                <p className="text-grayscale-900">{updatedAt}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                    Expires
                                </p>
                                <p className="text-grayscale-900">{expiresAt ?? 'Never'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                    Guardian consent
                                </p>
                                <p className="text-grayscale-900">
                                    {needsGuardianConsent ? 'Required' : 'Not required'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Reason for accessing
                            </p>
                            <p className="text-grayscale-900">
                                {reasonForAccessing ?? 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Redirect URL
                            </p>
                            <p className="text-xs text-grayscale-700 break-all">
                                {redirectUrl ?? 'Not specified'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Front door boost URI
                            </p>
                            <p className="text-xs text-grayscale-700 break-all">
                                {frontDoorBoostUri ?? 'Not specified'}
                            </p>
                        </div>
                    </div>
                </article>

                <article className="rounded-[20px] border border-grayscale-200 bg-grayscale-10 p-4 space-y-3">
                    <h2 className="text-lg font-semibold text-grayscale-900">Sharing Metadata</h2>
                    <div className="space-y-3 text-sm text-grayscale-700">
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Anonymize read data
                            </p>
                            <p className="text-grayscale-900">
                                {contractDefinition.read.anonymize ? 'Enabled' : 'Disabled'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Auto boosts
                            </p>
                            {renderStringChips(autoBoosts, 'No auto boosts configured')}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Writers
                            </p>
                            {renderProfileChips(writers, 'No writers configured')}
                        </div>
                    </div>
                </article>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[20px] border border-grayscale-200 bg-white p-4 space-y-3">
                    <h2 className="text-lg font-semibold text-grayscale-900">Read permissions</h2>
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                            Personal fields
                        </p>
                        {renderEntryChips(
                            contractDefinition.read.personal,
                            'No personal read fields defined'
                        )}
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                            Credential categories
                        </p>
                        {renderEntryChips(
                            contractDefinition.read.credentials.categories,
                            'No credential read categories defined'
                        )}
                    </div>
                </article>

                <article className="rounded-[20px] border border-grayscale-200 bg-white p-4 space-y-3">
                    <h2 className="text-lg font-semibold text-grayscale-900">Write permissions</h2>
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                            Personal fields
                        </p>
                        {renderEntryChips(
                            contractDefinition.write.personal,
                            'No personal write fields defined'
                        )}
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                            Credential categories
                        </p>
                        {renderEntryChips(
                            contractDefinition.write.credentials.categories,
                            'No credential write categories defined'
                        )}
                    </div>
                </article>
            </div>

            <section className="rounded-[20px] border border-grayscale-200 bg-grayscale-10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-grayscale-900">Consent records</h2>
                    {consentDataLoading && <IonSpinner color="dark" />}
                </div>

                {/* could definitely present this prettier */}
                {!consentDataLoading && data?.length > 0 && (
                    <ol className="space-y-3">
                        {data.map((terms, index) => (
                            <li
                                key={terms.personal.Name ?? index}
                                className="rounded-[20px] border border-grayscale-200 bg-white p-3"
                            >
                                <pre className="overflow-x-auto text-xs text-grayscale-700">
                                    {JSON.stringify(terms, null, 4)}
                                </pre>
                            </li>
                        ))}
                    </ol>
                )}
                {!consentDataLoading && data?.length === 0 && (
                    <p className="h-[120px] flex items-center justify-center text-sm text-grayscale-600">
                        No one has consented to this contract yet
                    </p>
                )}
                {contractLoading && !data?.length && (
                    <div className="w-full h-[120px] flex flex-col gap-[5px] items-center justify-center">
                        <IonSpinner color="dark" />
                        <span className="text-sm text-grayscale-600">Loading...</span>
                    </div>
                )}
            </section>
        </section>
    );
};

export default ViewContractDataModal;
