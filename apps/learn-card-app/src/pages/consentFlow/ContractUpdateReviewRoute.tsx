import React, { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { buildContractUpdatePreview } from '@learncard/helpers';
import {
    contractCategoryNameToCategoryMetadata,
    useConsentedContracts,
    useCurrentUser,
    useGetCurrentLCNUser,
    useUpdateTerms,
    useWallet,
} from 'learn-card-base';
import { useGuardianGate } from '../../hooks/useGuardianGate';
import {
    applyContractUpdateScopeChoices,
    getEnabledOptionalUpdateScopeKeys,
    getUnchangedAccessSummary,
} from './contractUpdateReview.helpers';
import ContractUpdateReview from './ContractUpdateReview';

const ContractUpdateReviewRoute: React.FC = () => {
    const location = useLocation();
    const history = useHistory();
    const uri = new URLSearchParams(location.search).get('uri') ?? '';
    const { data: records, isLoading, refetch } = useConsentedContracts();
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
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
        enabled: Boolean(uri && currentLCNUser?.profileId),
    });
    const { guardedAction, isChildProfile } = useGuardianGate();

    const preview = useMemo(() => {
        if (!latestUpdate?.preview) return undefined;
        return statusQuery.data?.status === 'suspended'
            ? buildContractUpdatePreview({
                  name: contract?.name ?? '',
                  kind: latestUpdate.kind,
                  diff: latestUpdate.diff,
                  status: 'suspended',
              })
            : latestUpdate.preview;
    }, [contract?.name, latestUpdate, statusQuery.data?.status]);
    const unchangedRows = useMemo(
        () =>
            contract && latestUpdate
                ? getUnchangedAccessSummary(
                      contract,
                      latestUpdate.diff,
                      record?.terms,
                      key => contractCategoryNameToCategoryMetadata(key)?.title
                  )
                : [],
        [contract, latestUpdate, record?.terms]
    );

    if (statusQuery.isError) {
        return (
            <main
                className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white"
                role="alert"
            >
                <p className="text-grayscale-700">
                    We couldn’t load this update. Please try again.
                </p>
                <button
                    type="button"
                    onClick={() => void statusQuery.refetch()}
                    className="rounded-full bg-grayscale-900 px-4 py-2 text-white"
                >
                    Try again
                </button>
            </main>
        );
    }
    if (isLoading || statusQuery.isLoading || !record || !contract || !latestUpdate || !preview) {
        return (
            <main
                className="flex min-h-screen items-center justify-center bg-white"
                aria-live="polite"
            >
                {isLoading || statusQuery.isLoading ? (
                    <IonSpinner name="crescent" />
                ) : (
                    <p className="text-grayscale-700">This update is no longer available.</p>
                )}
            </main>
        );
    }

    const initialEnabledOptionalKeys = getEnabledOptionalUpdateScopeKeys(
        record.terms,
        latestUpdate.preview.rows
    );
    const hasPreviouslyEnabledOptionalChoices = initialEnabledOptionalKeys.length > 0;
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
                await updateTerms({ terms, shareAllCategories });
                await refetch();
            };
            if (isChildProfile) {
                await guardedAction(saveOptionalChoices);
            } else {
                await saveOptionalChoices();
            }
            return;
        }

        const saveApproval = async () => {
            const result = await updateTerms({
                terms,
                acceptVersion: latestUpdate.toVersion,
                shareAllCategories,
            });
            if (!result) throw new Error('Could not save your choice. Please try again.');
            await refetch();
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
            unchangedRows={unchangedRows}
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
