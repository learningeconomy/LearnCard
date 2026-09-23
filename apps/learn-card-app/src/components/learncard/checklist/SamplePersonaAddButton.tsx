import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    getLogger,
    switchedProfileStore,
    ToastTypeEnum,
    useConsentToContract,
    useContract,
    useCurrentUser,
    useSyncConsentFlow,
    useToast,
    useWallet,
} from 'learn-card-base';
import type { SamplePersonaConfig } from 'learn-card-base/config/tenantConfig';

import { getMinimumTermsForContract } from '../../../helpers/contract.helpers';
import * as m from '../../../paraglide/messages.js';

const log = getLogger('sample-persona-add');

type AddStatus = 'idle' | 'connecting' | 'syncing';

interface SamplePersonaAddButtonProps {
    persona: SamplePersonaConfig;
    label?: string;
    onComplete?: () => void;
    className?: string;
}

const SamplePersonaAddButton: React.FC<SamplePersonaAddButtonProps> = ({
    persona,
    label,
    onComplete,
    className = '',
}) => {
    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();
    const { presentToast } = useToast();
    const { initWallet } = useWallet();
    const [status, setStatus] = useState<AddStatus>('idle');
    const { data: contract, isLoading: contractLoading } = useContract(persona.contractUri);
    const { mutateAsync: consentToContract, isPending } = useConsentToContract(
        persona.contractUri,
        contract?.owner?.did ?? ''
    );
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const addPersona = async (): Promise<void> => {
        if (!contract) return;

        setStatus('connecting');
        let consentCreated = false;
        try {
            const expectedCredentialCount = contract.autoBoosts?.length ?? 0;
            if (expectedCredentialCount === 0) {
                throw new Error('Sample contract has no auto-boost credentials');
            }

            const { termsUri } = await consentToContract({
                terms: getMinimumTermsForContract(contract.contract, currentUser),
                expiresAt: '',
                oneTime: false,
            });
            consentCreated = true;
            await queryClient.refetchQueries({
                queryKey: ['useConsentedContracts', switchedProfileStore.get.switchedDid() ?? ''],
            });

            setStatus('syncing');
            const syncResult = await fetchNewContractCredentials();
            if (syncResult.isError) {
                throw syncResult.error ?? new Error('Sample credential sync failed');
            }

            const wallet = await initWallet();
            const issuedCredentials = await wallet.invoke.getCredentialsForContract(termsUri, {
                limit: expectedCredentialCount,
            });
            if (issuedCredentials.records.length < expectedCredentialCount) {
                throw new Error(
                    `Sample credential sync returned ${issuedCredentials.records.length} of ${expectedCredentialCount} expected records`
                );
            }

            presentToast(m['passport.buildMyLearnCard.samplePersona.addSuccess'](), {
                hasDismissButton: true,
            });
            onComplete?.();
        } catch (error) {
            presentToast(
                consentCreated
                    ? m['passport.buildMyLearnCard.samplePersona.addPartialError']()
                    : m['passport.buildMyLearnCard.samplePersona.addError'](),
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
            log.error(error);
        } finally {
            setStatus('idle');
        }
    };

    const isLoading = contractLoading || isPending || status !== 'idle';
    const loadingLabel =
        status === 'syncing'
            ? m['passport.buildMyLearnCard.samplePersona.adding']()
            : m['passport.buildMyLearnCard.samplePersona.connecting']();

    return (
        <button
            type="button"
            onClick={() => void addPersona()}
            disabled={!contract || isLoading}
            className={`py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
        >
            {isLoading ? (
                <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loadingLabel}
                </>
            ) : (
                (label ?? m['passport.buildMyLearnCard.samplePersona.addAction']())
            )}
        </button>
    );
};

export default SamplePersonaAddButton;
