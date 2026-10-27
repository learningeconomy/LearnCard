import React, { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { buildContractUpdatePreview } from '@learncard/helpers';
import {
    isConsentConflict,
    useConsentedContracts,
    useCurrentUser,
    useGetCurrentLCNUser,
    useUpdateTerms,
    useWallet,
} from 'learn-card-base';
import { useGuardianGate } from '../../hooks/useGuardianGate';
import { useLocale } from '../../i18n';
import {
    applyContractUpdateScopeChoices,
    getEnabledOptionalUpdateScopeKeys,
    getUnchangedAccessScopes,
    isContractUpdateScopeEnabled,
} from './contractUpdateReview.helpers';
import { walletStore } from 'learn-card-base/stores/walletStore';
import { mDynamic } from '../../i18n/mDynamic';
import ContractUpdateReview from './ContractUpdateReview';

const ContractUpdateReviewRoute: React.FC = () => {
    const location = useLocation();
    const history = useHistory();
    const uri = new URLSearchParams(location.search).get('uri') ?? '';
    const locale = useLocale();
    const walletReady = Boolean(walletStore.use.wallet());
    const waitingForWallet = Boolean(uri) && !walletReady;
    const { data: records, isLoading, refetch } = useConsentedContracts();
    const currentUser = useCurrentUser();
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const { initWallet } = useWallet();
    const record = records?.find(item => item.contract?.uri === uri);
    const contract = record?.contract;
    const latestUpdate = record?.cumulativeUpdate ?? contract?.latestUpdate;
    const { mutateAsync: updateTerms } = useUpdateTerms(
        record?.uri ?? '',
        contract?.owner.did ?? '',
        uri
    );
    const statusQuery = useQuery({
        queryKey: ['consent-flow-update-status', uri, currentLCNUser?.profileId],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getConsentStatus(uri, currentLCNUser!.profileId);
        },
        enabled: Boolean(walletReady && uri && currentLCNUser?.profileId),
    });
    const { guardedAction, isChildProfile } = useGuardianGate();

    const preview = useMemo(() => {
        if (!latestUpdate?.preview) return undefined;
        return buildContractUpdatePreview({
            name: contract?.name ?? '',
            kind: latestUpdate.kind,
            diff: latestUpdate.diff,
            ...(statusQuery.data?.status === 'suspended' ? { status: 'suspended' as const } : {}),
            translate: mDynamic,
        });
    }, [contract?.name, latestUpdate, statusQuery.data?.status, locale]);
    const unchangedRows = useMemo(() => {
        if (!contract || !latestUpdate) return [];
        const unchangedScopes = getUnchangedAccessScopes(
            contract,
            latestUpdate.diff,
            record?.terms
        );
        const localizedRows = buildContractUpdatePreview({
            name: contract.name,
            kind: 'requires_consent',
            diff: { added: unchangedScopes, removed: [], changed: [] },
            translate: mDynamic,
        }).rows;
        return localizedRows.map(row => ({ area: row.scope.area, label: row.label }));
    }, [contract, latestUpdate, record?.terms, locale]);
    const hasExistingAccess = useMemo(() => {
        const terms = record?.terms;
        if (!contract || !terms) return false;
        return (
            getUnchangedAccessScopes(contract, { added: [], removed: [], changed: [] }, terms)
                .length > 0 ||
            Boolean(
                latestUpdate?.diff.removed.some(scope => isContractUpdateScopeEnabled(terms, scope))
            )
        );
    }, [contract, record?.terms, latestUpdate]);

    if (statusQuery.isError && !waitingForWallet) {
        return (
            <main
                className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white"
                role="alert"
            >
                <p className="text-grayscale-700">{mDynamic('consentUpdate.ui.loadError')}</p>
                <button
                    type="button"
                    onClick={() => void statusQuery.refetch()}
                    className="rounded-full bg-grayscale-900 px-4 py-2 text-white"
                >
                    {mDynamic('consentUpdate.ui.tryAgain')}
                </button>
            </main>
        );
    }
    if (
        waitingForWallet ||
        isLoading ||
        currentLCNUserLoading ||
        statusQuery.isLoading ||
        !record ||
        !contract ||
        !latestUpdate ||
        !preview
    ) {
        return (
            <main
                className="flex min-h-screen items-center justify-center bg-white"
                aria-live="polite"
            >
                {waitingForWallet || isLoading || currentLCNUserLoading || statusQuery.isLoading ? (
                    <IonSpinner name="crescent" />
                ) : (
                    <p className="text-grayscale-700">
                        {mDynamic('consentUpdate.ui.noLongerAvailable')}
                    </p>
                )}
            </main>
        );
    }

    const initialEnabledOptionalKeys = getEnabledOptionalUpdateScopeKeys(
        record.terms,
        latestUpdate.preview.rows
    );
    const hasPreviouslyEnabledOptionalChoices = initialEnabledOptionalKeys.length > 0;
    const alreadyHandled = (statusQuery.data?.consentedVersion ?? 0) >= latestUpdate.toVersion;
    const accept = async (enabledOptionalKeys: string[]) => {
        if (latestUpdate.kind === 'relaxed') return;

        const terms = structuredClone(record.terms);

        const shareAllCategories = applyContractUpdateScopeChoices(
            terms,
            latestUpdate.preview.rows,
            enabledOptionalKeys,
            Object.keys(contract.contract.read.credentials.categories),
            currentUser
        );
        if (latestUpdate.kind === 'expanded_optional') {
            if (!enabledOptionalKeys.length && !hasPreviouslyEnabledOptionalChoices) return;
            const saveOptionalChoices = async () => {
                try {
                    await updateTerms({ terms, shareAllCategories });
                    await refetch();
                } catch (error) {
                    if (isConsentConflict(error)) await refetch();
                    throw error;
                }
            };
            if (isChildProfile) {
                await guardedAction(saveOptionalChoices);
            } else {
                await saveOptionalChoices();
            }
            return;
        }

        const saveApproval = async () => {
            try {
                const result = await updateTerms({
                    terms,
                    ...(alreadyHandled ? {} : { acceptVersion: latestUpdate.toVersion }),
                    shareAllCategories,
                });
                if (!result) throw new Error('Could not save your choice. Please try again.');
                await refetch();
            } catch (error) {
                if (isConsentConflict(error)) await refetch();
                throw error;
            }
        };
        if (isChildProfile) await guardedAction(saveApproval);
        else await saveApproval();
    };

    const decline = async () => {
        const wallet = await initWallet();
        await wallet.invoke.withdrawConsent(record.uri);
        await refetch();
    };

    return (
        <ContractUpdateReview
            key={`${contract.uri}:${latestUpdate.toVersion}`}
            open
            name={contract.name}
            image={contract.image}
            reason={latestUpdate.reason}
            deadline={record.reconsentDeadline ?? latestUpdate.reconsentDeadline}
            preview={preview}
            guardianContract={contract}
            needsGuardianConsent={isChildProfile}
            alreadyHandled={alreadyHandled}
            unchangedRows={unchangedRows}
            hasExistingAccess={hasExistingAccess}
            initialEnabledOptionalKeys={initialEnabledOptionalKeys}
            onAccept={accept}
            onDecline={decline}
            onClose={() =>
                history.action === 'POP' ? history.replace('/wallet') : history.goBack()
            }
        />
    );
};

export default ContractUpdateReviewRoute;
