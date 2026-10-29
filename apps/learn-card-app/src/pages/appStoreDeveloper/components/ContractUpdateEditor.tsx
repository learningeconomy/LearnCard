import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useImmer } from 'use-immer';
import { Eye, Loader2, Upload } from 'lucide-react';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { buildContractUpdatePreview, classifyContractChange } from '@learncard/helpers';
import {
    getLogger,
    isConsentConflict,
    useImageUpload,
    useWallet,
    useModal,
    ModalTypes,
} from 'learn-card-base';
import type { UploadRes } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { useLocale } from '../../../i18n';
import { mDynamic } from '../../../i18n/mDynamic';
import { ContractUpdateReviewContent } from '../../consentFlow/ContractUpdateReview';
import {
    getDefaultEnabledOptionalUpdateScopeKeys,
    getUnchangedDefaultAccessScopes,
} from '../../consentFlow/contractUpdateReview.helpers';
import ConsentContractForm from './ConsentContractForm';
import ContractUpdateChangesSummary from './ContractUpdateChangesSummary';
import { buildContractFormChanges, contractToFormValue } from './consentContractForm.helpers';
import type { ConsentContractFormValue } from './consentContractForm.types';

const log = getLogger('contract-update-editor');

class ContractUpdatesUnavailableError extends Error {
    constructor() {
        super('The network did not return contract version metadata');
        this.name = 'ContractUpdatesUnavailableError';
    }
}

const hasContractVersion = (contract: ConsentFlowContractDetails): boolean =>
    Number.isInteger(contract.version) && contract.version > 0;

const requireContractVersion = (
    contract: ConsentFlowContractDetails
): ConsentFlowContractDetails => {
    if (!hasContractVersion(contract)) throw new ContractUpdatesUnavailableError();
    return contract;
};

const LoadedContractUpdateEditor: React.FC<{
    uri: string;
    initial: ConsentFlowContractDetails;
}> = ({ uri, initial }) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    useLocale();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const [baseline, setBaseline] = useState(initial);
    const [value, setValue] = useImmer<ConsentContractFormValue>(() =>
        contractToFormValue(initial)
    );
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState<'preview' | 'publish' | 'reload' | null>(null);
    const inFlight = useRef(false);
    const [error, setError] = useState('');
    const [needsReload, setNeedsReload] = useState(false);
    const [publishedVersion, setPublishedVersion] = useState<number>();
    const { handleFileSelect, isLoading: imageUploading } = useImageUpload({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data: UploadRes) =>
            setValue(draft => {
                draft.image = data.url;
            }),
    });
    const previous = useMemo(() => contractToFormValue(baseline), [baseline]);
    const draft = useMemo(() => {
        const changes = buildContractFormChanges(baseline, value);
        return { changes, kind: classifyContractChange(previous, value) };
    }, [baseline, previous, value]);
    const hasChanges = Object.keys(draft.changes).length > 0;
    const reasonRequired = draft.kind === 'requires_consent';
    const valid =
        Boolean(value.name.trim()) && hasChanges && (!reasonRequired || Boolean(reason.trim()));
    const acceptBaseline = (contract: ConsentFlowContractDetails) => {
        requireContractVersion(contract);
        setBaseline(contract);
        setValue(contractToFormValue(contract));
        queryClient.setQueryData(['developer-contract-update', uri], contract);
        setNeedsReload(false);
        setReason('');
    };
    const reload = async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy('reload');
        setError('');
        try {
            const wallet = await initWallet();
            const current = await wallet.invoke.getContract(uri);
            if (!current) throw new Error('Contract not found');
            acceptBaseline(current);
        } catch (cause) {
            log.error('Could not reload request', cause);
            setError(
                mDynamic(
                    cause instanceof ContractUpdatesUnavailableError
                        ? 'consentUpdate.editor.unsupportedNetwork'
                        : 'consentUpdate.editor.loadError'
                )
            );
        } finally {
            inFlight.current = false;
            setBusy(null);
        }
    };
    const submit = async (action: 'preview' | 'publish') => {
        if (inFlight.current || !valid || needsReload || baseline.status === 'retired') return;
        inFlight.current = true;
        setBusy(action);
        setError('');
        setPublishedVersion(undefined);
        try {
            const wallet = await initWallet();
            const current = await wallet.invoke.getContract(uri);
            if (current) requireContractVersion(current);
            if (!current || current.version !== baseline.version) {
                setNeedsReload(true);
                setError(mDynamic('consentUpdate.editor.conflict'));
                return;
            }
            const result = await wallet.invoke.updateContract(uri, draft.changes, {
                reason: reason.trim() || undefined,
                dryRun: action === 'preview',
            });
            if (action === 'preview') {
                const rows = result.preview.rows;
                const diff = {
                    added: rows.filter(row => row.change === 'added').map(row => row.scope),
                    removed: rows.filter(row => row.change === 'removed').map(row => row.scope),
                    changed: rows.filter(row => row.change === 'changed').map(row => row.scope),
                };
                const preview = buildContractUpdatePreview({
                    name: value.name,
                    kind: result.kind,
                    diff,
                    translate: mDynamic,
                });
                const defaults = getUnchangedDefaultAccessScopes(baseline, diff);
                newModal(
                    <ContractUpdateReviewContent
                        name={value.name}
                        image={value.image}
                        reason={reason.trim() || undefined}
                        preview={preview}
                        initialEnabledOptionalKeys={getDefaultEnabledOptionalUpdateScopeKeys(
                            value.contract,
                            preview.rows
                        )}
                        unchangedRows={buildContractUpdatePreview({
                            name: baseline.name,
                            kind: 'requires_consent',
                            diff: { added: defaults, removed: [], changed: [] },
                            translate: mDynamic,
                        }).rows.map(row => ({ area: row.scope.area, label: row.label }))}
                        accessContext="defaults"
                        readOnly
                        onClose={closeModal}
                    />,
                    {
                        sectionClassName:
                            '!bg-white !w-full !h-full !max-w-none !rounded-none overflow-hidden flex flex-col',
                    }
                );
                return;
            }
            setPublishedVersion(result.version);
            // A reload failure after publication must not offer to publish the same draft again.
            setNeedsReload(true);
            try {
                const saved = await wallet.invoke.getContract(uri);
                if (!saved) throw new Error('Published request not found');
                acceptBaseline(saved);
            } catch (cause) {
                log.error('Published request could not be reloaded', cause);
                setError(mDynamic('consentUpdate.editor.publishedReloadError'));
            }
        } catch (cause) {
            log.error('Contract update failed', cause);
            if (cause instanceof ContractUpdatesUnavailableError) {
                setNeedsReload(true);
                setError(mDynamic('consentUpdate.editor.unsupportedNetwork'));
            } else if (isConsentConflict(cause)) {
                setNeedsReload(true);
                setError(mDynamic('consentUpdate.editor.conflict'));
            } else
                setError(
                    mDynamic(
                        action === 'preview'
                            ? 'consentUpdate.editor.previewError'
                            : 'consentUpdate.editor.publishError'
                    )
                );
        } finally {
            inFlight.current = false;
            setBusy(null);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <p className="pb-1 text-xs text-grayscale-500">
                {mDynamic('consentUpdate.editor.currentVersion', { version: baseline.version })}
            </p>
            <ConsentContractForm
                value={value}
                onChange={setValue}
                disabled={Boolean(busy) || needsReload || baseline.status === 'retired'}
                imageUploading={imageUploading}
                onSelectImage={handleFileSelect}
            />
            {hasChanges && (
                <div className="space-y-8 border-t border-grayscale-200 pt-8">
                    <ContractUpdateChangesSummary
                        baseline={baseline}
                        value={value}
                        changes={draft.changes}
                        kind={draft.kind}
                    />
                    <section className="space-y-3">
                        <label
                            htmlFor="contract-update-reason"
                            className="block text-sm font-medium text-grayscale-900"
                        >
                            {mDynamic('consentUpdate.editor.reason')}
                            {reasonRequired ? ' *' : ''}
                        </label>
                        <textarea
                            id="contract-update-reason"
                            value={reason}
                            onChange={event => setReason(event.target.value)}
                            disabled={Boolean(busy) || needsReload}
                            maxLength={140}
                            rows={3}
                            placeholder={mDynamic('consentUpdate.editor.reasonPlaceholder')}
                            className="w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <p className="text-xs leading-relaxed text-grayscale-500">
                            {mDynamic(
                                reasonRequired
                                    ? 'consentUpdate.editor.reasonRequired'
                                    : 'consentUpdate.editor.reasonHint'
                            )}
                        </p>
                    </section>
                </div>
            )}
            {baseline.status === 'retired' && (
                <p role="alert" className="text-sm text-amber-700">
                    {mDynamic('consentUpdate.editor.retired')}
                </p>
            )}
            {publishedVersion !== undefined && (
                <p
                    role="status"
                    className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                    {mDynamic('consentUpdate.editor.published', { version: publishedVersion })}
                </p>
            )}
            {error && (
                <p
                    role="alert"
                    className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </p>
            )}
            {needsReload ? (
                <button
                    type="button"
                    onClick={() => void reload()}
                    disabled={Boolean(busy)}
                    className="rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm text-grayscale-700 disabled:opacity-40"
                >
                    {mDynamic(
                        busy === 'reload'
                            ? 'consentUpdate.editor.reloading'
                            : 'consentUpdate.editor.reload'
                    )}
                </button>
            ) : (
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => void submit('preview')}
                        disabled={
                            !valid ||
                            Boolean(busy) ||
                            imageUploading ||
                            baseline.status === 'retired'
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {busy === 'preview' ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Eye size={16} />
                        )}
                        {mDynamic(
                            busy === 'preview'
                                ? 'consentUpdate.editor.previewing'
                                : 'consentUpdate.editor.preview'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => void submit('publish')}
                        disabled={
                            !valid ||
                            Boolean(busy) ||
                            imageUploading ||
                            baseline.status === 'retired'
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {busy === 'publish' ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Upload size={16} />
                        )}
                        {mDynamic(
                            busy === 'publish'
                                ? 'consentUpdate.editor.publishing'
                                : 'consentUpdate.editor.publish'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

const ContractUpdateEditor: React.FC<{ contractUri: string }> = ({ contractUri }) => {
    const { initWallet } = useWallet();
    const query = useQuery({
        queryKey: ['developer-contract-update', contractUri],
        queryFn: async () => {
            const wallet = await initWallet();
            const contract = await wallet.invoke.getContract(contractUri);
            if (!contract) throw new Error('Contract not found');
            return requireContractVersion(contract);
        },
        enabled: Boolean(contractUri),
        staleTime: Infinity,
        retry: false,
    });
    const updatesUnavailable =
        query.error instanceof ContractUpdatesUnavailableError ||
        (query.data && !hasContractVersion(query.data));
    return (
        <section className="space-y-5 font-poppins">
            <p className="text-sm leading-relaxed text-grayscale-600">
                {mDynamic('consentUpdate.editor.description')}
            </p>
            {!contractUri ? (
                <p className="text-sm text-grayscale-600">
                    {mDynamic('consentUpdate.editor.noContract')}
                </p>
            ) : query.isLoading ? (
                <p role="status" className="flex items-center gap-2 text-sm text-grayscale-600">
                    <Loader2 size={16} className="animate-spin" />
                    {mDynamic('consentUpdate.editor.loading')}
                </p>
            ) : query.isError || !query.data || updatesUnavailable ? (
                <div className="space-y-3">
                    <p role="alert" className="text-sm text-red-700">
                        {mDynamic(
                            updatesUnavailable
                                ? 'consentUpdate.editor.unsupportedNetwork'
                                : 'consentUpdate.editor.loadError'
                        )}
                    </p>
                    <button
                        type="button"
                        onClick={() => void query.refetch()}
                        disabled={query.isFetching}
                        className="rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm text-grayscale-700"
                    >
                        {mDynamic(
                            query.isFetching
                                ? 'consentUpdate.editor.reloading'
                                : 'consentUpdate.editor.retry'
                        )}
                    </button>
                </div>
            ) : (
                <LoadedContractUpdateEditor
                    key={contractUri}
                    uri={contractUri}
                    initial={query.data}
                />
            )}
        </section>
    );
};

export default ContractUpdateEditor;
