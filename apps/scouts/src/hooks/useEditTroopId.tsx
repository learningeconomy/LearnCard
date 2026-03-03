import React, { useState } from 'react';

import {
    useModal,
    ModalTypes,
    useGetCredentialWithEdits,
    useEditBoostMeta,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import useGetTroopNetwork from './useGetTroopNetwork';

import TroopsCMSWrapper from '../components/troopsCMS/TroopsCMSWrapper';
import TroopsIDCMSWrapper from '../components/troopsCMS/TroopsIDCMS/TroopIDCMSWrapper';
import {
    initializeTroopStateForCredential,
    TroopsCMSEditorModeEnum,
    TroopsCMSState,
    TroopsCMSViewModeEnum,
} from '../components/troopsCMS/troopCMSState';

import { getRoleFromCred } from '../helpers/troop.helpers';
import { ScoutsRoleEnum } from '../stores/troopPageStore';
import { VC } from '@learncard/types';

export const useEditTroopId = (credential: VC, uri?: string) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    if (credential && !credential?.boostId && uri) {
        // add uri to credential if it's not already there
        credential = { ...credential, boostId: uri };
    }

    const { credentialWithEdits } = useGetCredentialWithEdits(credential);
    credential = credentialWithEdits ?? credential;

    const network = useGetTroopNetwork(credential, uri);

    const role = getRoleFromCred(credential);

    let idViewMode: TroopsCMSViewModeEnum;
    let idViewModeSubtype: TroopsCMSViewModeEnum;
    switch (role) {
        case ScoutsRoleEnum.leader:
            idViewMode = TroopsCMSViewModeEnum.troop;
            idViewModeSubtype = TroopsCMSViewModeEnum.leader;
            break;
        case ScoutsRoleEnum.national:
            idViewMode = TroopsCMSViewModeEnum.network;
            idViewModeSubtype = TroopsCMSViewModeEnum.leader;
            break;
        case ScoutsRoleEnum.global:
            idViewMode = TroopsCMSViewModeEnum.global;
            idViewModeSubtype = TroopsCMSViewModeEnum.leader; // ?
            break;
        case ScoutsRoleEnum.scout:
        default:
            idViewMode = TroopsCMSViewModeEnum.troop;
            idViewModeSubtype = TroopsCMSViewModeEnum.member;
            break;
    }

    const [state, setState] = useState<TroopsCMSState>(
        initializeTroopStateForCredential(credential, idViewMode)
    );

    const { mutateAsync: editBoost } = useEditBoostMeta();

    const { presentToast } = useToast();
    const editBoostUri = credential?.boostId;
    const handleEditBoost = async (state: TroopsCMSState) => {
        if (!editBoostUri || !state) return;

        try {
            const success = await editBoost({
                boostUri: editBoostUri,
                state,
            });
            setState(state);

            closeModal();
        } catch (e) {
            console.error('handleEditBoostID::error', e);
            presentToast(`Error editing boost ID`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const openEditIdModal = () => {
        // TODO there's an edge case where if you edit the ID via the top level CMS (i.e. through the "Edit Troop/Network" button in the footer)
        //   -> save -> call this function (via the pencil icon in the members box) without closing and re-opening the troop page
        //   then the state will be out of date (it won't have the ID changes that were just made at the top level)

        // Actually this is unused now since the MembersBoxIdRow was removed from the Troop Page so this is never isolated from
        // the larger CMS anymore

        newModal(
            <TroopsIDCMSWrapper
                handleCloseModal={closeModal}
                rootViewMode={idViewMode}
                viewMode={idViewModeSubtype}
                editorMode={TroopsCMSEditorModeEnum.edit}
                state={state}
                handleSaveOverride={handleEditBoost}
                editIdOnlyMode
            />
        );
    };

    const openEditTroopOrNetworkModal = () => {
        newModal(
            <TroopsCMSWrapper
                credential={credential}
                handleCloseModal={closeModal}
                viewMode={idViewMode}
                parentUri={network?.uri}
                onSuccess={(_, updatedState) => {
                    if (updatedState) {
                        setState(updatedState);
                    }
                }}
            />
        );
    };

    return { openEditIdModal, openEditTroopOrNetworkModal };
};

export default useEditTroopId;
