import React from 'react';
import moment from 'moment';

import { IonSpinner } from '@ionic/react';
import { ConsentFlowContractData, ConsentFlowContractDetails } from '@learncard/types';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import {
    contractCategoryNameToCategoryMetadata,
    useConsentFlowDataForDid,
    useContract,
    useGetConsentFlowData,
    useModal,
    useWallet,
} from 'learn-card-base';

import Share from '../../components/svgs/Share';
import CopyStack from '../../components/svgs/CopyStack';
import CreateContractModal from './CreateContractModal';
import ShareContractModal from './ShareContractModal';
import * as m from '../../paraglide/messages.js';
import { IonSpinner } from '@ionic/react';

import { ConsentFlowContractDetails } from '@learncard/types';
import { getInfoFromContractKey } from '../../helpers/contract.helpers';

type ViewContractDataModalProps = {
    contract: ConsentFlowContractDetails;
    onCreateSuccess?: (contractUri?: string) => void;
};

type EntryConfig = {
    required: boolean;
    defaultEnabled?: boolean;
};

const formatDateParts = (value?: string) => {
    if (!value) {
        return { date: 'none', time: '' };
    }

    const date = moment(value);

    if (!date.isValid()) {
        return { date: value, time: '' };
    }

    return {
        date: date.format('MMM D, YYYY'),
        time: date.format('h:mm A'),
    };
};

const renderMutedValue = (value?: string) => {
    if (!value) {
        return <span className="text-sm text-grayscale-400">none</span>;
    }

    return <span className="text-sm text-grayscale-700 break-all">{value}</span>;
};

const getPermissionModeLabel = (config: EntryConfig) => {
    if (config.required) {
        return 'Required';
    }

    return config.defaultEnabled ? 'Opt-out' : 'Opt-in';
};

const getPermissionModeClassName = (config: EntryConfig) => {
    if (config.required) {
        return 'text-grayscale-900 bg-grayscale-100';
    }

    return config.defaultEnabled
        ? 'text-amber-800 bg-amber-50'
        : 'text-grayscale-600 bg-grayscale-100';
};

const renderCategoryPermissions = (
    entries: Record<string, EntryConfig> | undefined,
    emptyLabel: string
) => {
    const entryList = Object.entries(entries ?? {});

    if (!entryList.length) {
        return <p className="text-sm text-grayscale-400">{emptyLabel}</p>;
    }

    return (
        <div className="grid gap-2">
            {entryList.map(([key, config]) => {
                const { IconComponent, title } = getInfoFromContractKey(key);
                const metadata = contractCategoryNameToCategoryMetadata(key);
                const CategoryIcon = metadata?.IconWithShape;

                return (
                    <div
                        key={key}
                        className="grid w-full min-w-0 grid-cols-[40px,minmax(0,1fr)] items-start gap-3 rounded-[16px] border border-grayscale-200 bg-white px-3 py-3"
                    >
                        {CategoryIcon ? (
                            <CategoryIcon className="h-10 w-10 shrink-0" />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grayscale-100">
                                <IconComponent className="h-6 w-6 text-grayscale-500" />
                            </div>
                        )}

                        <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium text-grayscale-900 break-words leading-snug">
                                {title}
                            </p>
                            <p className="text-xs text-grayscale-500 break-all">{key}</p>
                            <span
                                className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-medium ${getPermissionModeClassName(
                                    config
                                )}`}
                            >
                                {getPermissionModeLabel(config)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
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
            {values.map((profile: NonNullable<ConsentFlowContractDetails['writers']>[number]) => (
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
    const [isConsentRecordsOpen, setIsConsentRecordsOpen] = React.useState(false);
    const [didInput, setDidInput] = React.useState('');
    const [activeDidFilter, setActiveDidFilter] = React.useState('');
    const [resolvedDidFilter, setResolvedDidFilter] = React.useState('');
    const [filterInputMode, setFilterInputMode] = React.useState<'did' | 'profileId'>('did');
    const { data: contractDetails, isLoading: contractLoading } = useContract(contract.uri);
    const resolvedContract = contractDetails ?? contract;
    const { initWallet } = useWallet();

    const {
        data: paginatedData,
        isLoading: consentDataLoading,
        refetch: refetchConsentData,
    } = useGetConsentFlowData(resolvedContract.uri);
    const consentRecords = React.useMemo(() => {
        if (Array.isArray(paginatedData)) {
            return paginatedData;
        }

        return (
            (paginatedData as unknown as { records?: ConsentFlowContractData[] } | undefined)
                ?.records ?? []
        );
    }, [paginatedData]);

    const normalizedDidFilter = resolvedDidFilter.trim();
    const shouldFilterByDid = Boolean(normalizedDidFilter);

    const {
        data: consentDataForDid,
        isLoading: consentDataForDidLoading,
        isFetching: consentDataForDidFetching,
        refetch: refetchConsentDataForDid,
    } = useConsentFlowDataForDid(normalizedDidFilter || undefined, undefined, shouldFilterByDid);

    const didFilteredConsentRecords = React.useMemo(() => {
        const records =
            (consentDataForDid as { records?: { contractUri?: string }[] } | undefined | null)
                ?.records ?? [];

        return records.filter(record => record.contractUri === resolvedContract.uri);
    }, [consentDataForDid, resolvedContract.uri]);

    const visibleConsentRecords = shouldFilterByDid ? didFilteredConsentRecords : consentRecords;
    const visibleConsentRecordsLoading = shouldFilterByDid
        ? consentDataForDidLoading || consentDataForDidFetching
        : consentDataLoading;

    const resolveFilterInput = async (input: string) => {
        const trimmedInput = input.trim();

        if (!trimmedInput) {
            setResolvedDidFilter('');
            return;
        }

        const looksLikeDid = trimmedInput.toLowerCase().startsWith('did:');

        if (looksLikeDid) {
            setFilterInputMode('did');
            setResolvedDidFilter(trimmedInput);
            return;
        }

        setFilterInputMode('profileId');

        try {
            const wallet = await initWallet();
            const profile = await wallet.invoke.getProfile(trimmedInput);
            const profileDid = (profile as { did?: string } | undefined)?.did;

            if (profileDid) {
                setResolvedDidFilter(profileDid);
                return;
            }

            setResolvedDidFilter(trimmedInput);
        } catch {
            setResolvedDidFilter(trimmedInput);
        }
    };

    const submitDidFilter = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextFilter = didInput.trim();
        setActiveDidFilter(nextFilter);
        await resolveFilterInput(nextFilter);
    };

    const clearDidFilter = () => {
        setDidInput('');
        setActiveDidFilter('');
        setResolvedDidFilter('');
        setFilterInputMode('did');
    };

    const refreshConsentRecords = async () => {
        if (shouldFilterByDid) {
            await refetchConsentDataForDid();
            return;
        }

        await refetchConsentData();
    };

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

    const createdAtParts = formatDateParts(createdAt);
    const updatedAtParts = formatDateParts(updatedAt);

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
                    sectionClassName: '!max-w-[500px] !max-h-[70vh]',
                    usePortal: true,
                    hideButton: true,
                    portalClassName: '!max-w-[500px]',
                }
            );
        }, 0);
    };

    return (
        <section className="text-grayscale-900 w-full px-[24px] py-[28px] min-h-[300px] space-y-5">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3 min-w-0">
                    {image ? (
                        <img
                            src={image}
                            alt={`${name} icon`}
                            className="h-[64px] w-[64px] shrink-0 rounded-full border border-grayscale-200 bg-white object-cover"
                        />
                    ) : (
                        <div className="h-[64px] w-[64px] shrink-0 rounded-full border border-grayscale-200 bg-grayscale-100" />
                    )}

                    <div className="flex items-start justify-end gap-2 shrink-0">
                        <button
                            onClick={openCreateFromTemplateModal}
                            className="flex items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 px-2 py-2.5 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10"
                        >
                            <CopyStack className="h-[18px] w-[18px] shrink-0 text-grayscale-700" />
                            <span className="truncate">Use as template</span>
                        </button>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                openShareContractModal(resolvedContract);
                            }}
                            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[20px] border border-grayscale-300 bg-white transition-colors hover:bg-grayscale-10"
                            aria-label="Share contract"
                        >
                            <Share className="h-[22px] w-[22px] text-grayscale-700" />
                        </button>
                    </div>
                </div>

                <div className="min-w-0 space-y-1">
                    <h1 className="text-xl font-semibold text-grayscale-900 line-clamp-2">
                        {name}
                    </h1>
                    {subtitle && <p className="text-sm text-grayscale-600">{subtitle}</p>}
                </div>
            </div>

            {contractLoading && (
                <div className="w-full h-[120px] flex flex-col gap-[5px] items-center justify-center rounded-[20px] border border-grayscale-200 bg-grayscale-10">
                    <IonSpinner color="dark" />
                    <span className="text-sm text-grayscale-600">{m['common.loading']()}</span>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[20px] border border-grayscale-200 bg-grayscale-10 p-4 space-y-3">
                    <h2 className="text-lg font-semibold text-grayscale-900">Contract Details</h2>
                    <div className="space-y-3 text-sm text-grayscale-700">
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
                                <p className="text-grayscale-900">{createdAtParts.date}</p>
                                {createdAtParts.time && (
                                    <p className="text-xs text-grayscale-500">
                                        {createdAtParts.time}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                    Updated
                                </p>
                                <p className="text-grayscale-900">{updatedAtParts.date}</p>
                                {updatedAtParts.time && (
                                    <p className="text-xs text-grayscale-500">
                                        {updatedAtParts.time}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                    Expires
                                </p>
                                {expiresAt ? (
                                    <>
                                        <p className="text-grayscale-900">
                                            {formatDateParts(expiresAt).date}
                                        </p>
                                        {formatDateParts(expiresAt).time && (
                                            <p className="text-xs text-grayscale-500">
                                                {formatDateParts(expiresAt).time}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-sm text-grayscale-400">none</span>
                                )}
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
                                Description
                            </p>
                            {renderMutedValue(description)}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Reason for accessing
                            </p>
                            {renderMutedValue(reasonForAccessing)}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Redirect URL
                            </p>
                            {renderMutedValue(redirectUrl)}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Front door boost URI
                            </p>
                            {renderMutedValue(frontDoorBoostUri)}
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
                        {renderCategoryPermissions(
                            contractDefinition.read.credentials.categories,
                            'No credential read categories defined'
                        )}
                    </div>
                </article>

                <article className="rounded-[20px] border border-grayscale-200 bg-white p-4 space-y-3">
                    <h2 className="text-lg font-semibold text-grayscale-900">Write permissions</h2>
                    {Object.keys(contractDefinition.write.personal).length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                Personal fields
                            </p>
                            {renderEntryChips(
                                contractDefinition.write.personal,
                                'No personal write fields defined'
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                            Credential categories
                        </p>
                        {renderCategoryPermissions(
                            contractDefinition.write.credentials.categories,
                            'No credential write categories defined'
                        )}
                    </div>
                </article>
            </div>

            <details
                className="rounded-[20px] border border-grayscale-200 bg-grayscale-10 p-4 pb-5"
                open={isConsentRecordsOpen}
                onToggle={e => {
                    setIsConsentRecordsOpen(e.currentTarget.open);
                }}
            >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-semibold text-grayscale-900">
                    <div className="flex min-w-0 items-center gap-2">
                        <span>Consent records</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-grayscale-600">
                            {visibleConsentRecords.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {visibleConsentRecordsLoading && <IonSpinner color="dark" />}
                        <CaretDown
                            className={`h-[14px] w-[14px] text-grayscale-500 transition-transform duration-200 ${
                                isConsentRecordsOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                        />
                    </div>
                </summary>

                <div className="mt-4 max-h-[420px] overflow-y-auto space-y-3 pr-1 pb-2">
                    <form
                        onSubmit={submitDidFilter}
                        className="space-y-2 rounded-[20px] border border-grayscale-200 bg-white p-3"
                    >
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-grayscale-700">
                                Filter by DID or profile ID
                            </label>
                            <input
                                type="text"
                                value={didInput}
                                onChange={e => setDidInput(e.target.value)}
                                placeholder="did:key:... or profile-id"
                                className="w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={!didInput.trim() || visibleConsentRecordsLoading}
                            >
                                {visibleConsentRecordsLoading && shouldFilterByDid
                                    ? 'Searching...'
                                    : 'Search'}
                            </button>

                            <button
                                type="button"
                                onClick={clearDidFilter}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                                disabled={!didInput && !activeDidFilter}
                            >
                                Clear
                            </button>

                            <button
                                type="button"
                                onClick={refreshConsentRecords}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={visibleConsentRecordsLoading}
                            >
                                Refresh
                            </button>
                        </div>

                        {shouldFilterByDid && (
                            <p className="text-xs text-grayscale-500 break-all">
                                Showing consent records for{' '}
                                <span className="font-medium text-grayscale-700">
                                    {normalizedDidFilter}
                                </span>
                            </p>
                        )}
                    </form>

                    {!visibleConsentRecordsLoading && visibleConsentRecords.length > 0 && (
                        <ol className="space-y-3">
                            {visibleConsentRecords.map(
                                (terms: ConsentFlowContractData, index: number) => (
                                    <li
                                        key={terms.personal.Name ?? index}
                                        className="rounded-[20px] border border-grayscale-200 bg-white p-3"
                                    >
                                        <pre className="overflow-x-auto text-xs text-grayscale-700">
                                            {JSON.stringify(terms, null, 4)}
                                        </pre>
                                    </li>
                                )
                            )}
                        </ol>
                    )}
                    {!visibleConsentRecordsLoading && visibleConsentRecords.length === 0 && (
                        <p className="h-[120px] flex items-center justify-center text-sm text-grayscale-600">
                            {shouldFilterByDid
                                ? 'No consent records were found for this person on this contract'
                                : 'No one has consented to this contract yet'}
                        </p>
                    )}
                    {visibleConsentRecordsLoading && !visibleConsentRecords.length && (
                        <div className="w-full h-[120px] flex flex-col gap-[5px] items-center justify-center">
                            <IonSpinner color="dark" />
                            <span className="text-sm text-grayscale-600">
                                {shouldFilterByDid ? 'Loading DID records...' : 'Loading...'}
                            </span>
                        </div>
                    )}
                </div>
            </details>
        </section>
    );
};

export default ViewContractDataModal;
