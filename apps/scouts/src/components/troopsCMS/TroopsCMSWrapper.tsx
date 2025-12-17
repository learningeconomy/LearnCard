import React, { useEffect, useState, useMemo } from 'react';

import {
    lazyWithRetry,
    useGetBoostParents,
    useGetCredentialWithEdits,
    useResolveBoost,
    useGetBoost,
} from 'learn-card-base';
import useTroopMembers from '../../hooks/useTroopMembers';
import useTroopIds from '../../hooks/useTroopIds';

const TroopsCMS = lazyWithRetry(() => import('./TroopsCMS'));

import {
    TroopsCMSState,
    TroopsCMSViewModeEnum,
    initializeTroopState,
    mapParentIntoState,
    mapGrandParentIntoState,
    mapMemberIdIntoState,
    initializeTroopStateForCredential,
    TroopsCMSEditorModeEnum,
} from './troopCMSState';
import { VC } from '@learncard/types';
import { MemberTabsEnum } from '../../pages/troop/TroopPageMembersBox';

type TroopsCMSWrapperProps = {
    parentUri?: string;
    viewMode: TroopsCMSViewModeEnum;
    credential?: VC;
    handleCloseModal: () => void;
    onSuccess?: (boostUri?: string, state?: TroopsCMSState) => void;
};

export const TroopsCMSWrapper: React.FC<TroopsCMSWrapperProps> = ({
    parentUri,
    viewMode,
    credential,
    handleCloseModal,
    onSuccess,
}) => {
    // Initialize state with proper updates when credential/viewMode changes
    const [state, setState] = useState<TroopsCMSState>(
        credential
            ? initializeTroopStateForCredential(credential, viewMode)
            : initializeTroopState(viewMode)
    );

    // Re-initialize state when credential or view mode changes
    useEffect(() => {
        setState(
            credential
                ? initializeTroopStateForCredential(credential, viewMode)
                : initializeTroopState(viewMode)
        );
    }, [credential, viewMode]);

    // Parent boost handling
    const { data: _parentBoost, isLoading } = useResolveBoost(parentUri);
    const { credentialWithEdits: parentBoostWithEdits } = useGetCredentialWithEdits(
        _parentBoost,
        parentUri
    );
    const parentBoost = useMemo(
        () => parentBoostWithEdits ?? _parentBoost,
        [parentBoostWithEdits, _parentBoost]
    );

    // Grandparent boost handling
    const { data: parentBoosts } = useGetBoostParents(parentUri);
    const grandParentUri = parentBoosts?.records?.[0]?.uri;
    const { data: resolvedGrandParent } = useResolveBoost(grandParentUri, !grandParentUri);

    // Handle parent/grandparent data changes
    useEffect(() => {
        if (parentUri && parentBoost) {
            mapParentIntoState(state, setState, parentBoost, viewMode, parentUri);
        }

        if (grandParentUri && resolvedGrandParent) {
            mapGrandParentIntoState(state, setState, resolvedGrandParent, viewMode, parentUri);
        }
    }, [viewMode]);

    // Member management
    const { scoutRecipients, leaderRecipients, currentBoostRecipients } = useTroopMembers(
        credential,
        MemberTabsEnum.All,
        credential?.boostId
    );

    // Update member lists in state
    useEffect(() => {
        const updateMembers = () => {
            if (viewMode === TroopsCMSViewModeEnum.troop) {
                return {
                    admins: leaderRecipients?.map(r => ({ ...r.to, unremovable: true })) ?? [],
                    issueTo: scoutRecipients?.map(r => ({ ...r.to, unremovable: true })) ?? [],
                };
            }
            return {
                admins: currentBoostRecipients?.map(r => ({ ...r.to, unremovable: true })) ?? [],
            };
        };

        setState(prev => ({ ...prev, ...updateMembers() }));
    }, [viewMode, scoutRecipients, leaderRecipients, currentBoostRecipients]);

    // Scout ID management
    const [scoutIdMapped, setScoutIdMapped] = useState(false);
    const { scoutBoostUri, scoutId } = useTroopIds({
        credential,
        boostUri: credential?.boostId,
    });

    // Reset scout mapping when credential changes
    useEffect(() => {
        setScoutIdMapped(false);
    }, [credential]);

    // Map scout ID when available
    useEffect(() => {
        if (viewMode === TroopsCMSViewModeEnum.troop && scoutId && !scoutIdMapped) {
            mapMemberIdIntoState(state, setState, scoutId, scoutBoostUri);
            setScoutIdMapped(true);
        }
    }, [scoutId, scoutIdMapped, scoutBoostUri, viewMode]);

    const isEdit = !!credential;

    const { data: editingBoost } = useGetBoost(credential?.boostId || '');

    useEffect(() => {
        if (!isEdit || !editingBoost?.meta) return;

        const network = (editingBoost as any)?.meta?.network as
            | { networkType?: string; country?: string; region?: string; organization?: string }
            | undefined;

        if (network && Object.keys(network).length > 0) {
            if (process.env.NODE_ENV !== 'test') {
                console.log('TroopsCMSWrapper::editingBoost.meta.network', network);
            }
            setState(prev => ({
                ...prev,
                networkFields: {
                    ...prev.networkFields,
                    networkType: network?.networkType ?? prev.networkFields?.networkType ?? '',
                    country: network?.country ?? prev.networkFields?.country ?? '',
                    region: network?.region ?? prev.networkFields?.region ?? '',
                    organization:
                        network?.organization ?? prev.networkFields?.organization ?? '',
                },
            }));
        }
    }, [isEdit, editingBoost]);

    return (
        <TroopsCMS
            parentUri={parentUri}
            onSuccess={onSuccess}
            state={state}
            setState={setState}
            viewMode={viewMode}
            handleCloseModal={handleCloseModal}
            isParentBoostLoading={isLoading}
            editorMode={isEdit ? TroopsCMSEditorModeEnum.edit : TroopsCMSEditorModeEnum.create}
            editBoostUri={credential?.boostId}
            scoutBoostUri={scoutBoostUri}
        />
    );
};

export default TroopsCMSWrapper;
