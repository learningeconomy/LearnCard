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

import SyncCircleArrows from '../../svgs/SyncCircleArrows';
import { useTheme } from '../../../theme/hooks/useTheme';
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
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
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
            className={`py-[7px] px-[20px] rounded-[30px] bg-${primaryColor} font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center disabled:opacity-60 max-w-[650px] ${className}`}
        >
            {isLoading
                ? loadingLabel
                : (label ?? m['passport.buildMyLearnCard.samplePersona.addAction']())}
            <SyncCircleArrows className={isLoading ? 'animate-spin-ccw' : undefined} />
        </button>
    );
};

export default SamplePersonaAddButton;
