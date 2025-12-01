import React, { useState } from 'react';
import { z } from 'zod';

import { IonPage } from '@ionic/react';
import TroopsCMSLayout from './TroopsCMSLayout';
import TroopsCMSThumbnail from './TroopsCMSThumbnail';
import TroopsCMSHeader from './TroopsCMSHeader/TroopsCMSHeader';
import TroopsCMSFooter from './TroopsCMSFooter/TroopsCMSFooter';
import TroopCMSContentForm from './TroopsCMSContentForm/TroopsCMSContentForm';
import TroopsAppearanceForm from './TroopsCMSAppearanceForm/TroopsCMSAppearanceForm';
import TroopsCMSTabs, { TroopsCMSTabsEnum } from './TroopsCMSTabs/TroopsCMSTabs';
import TroopsIDTypeSelector from './TroopsIDTypeSelector/TroopsIDTypeSelector';
import BoostLoader from '../boost/boostLoader/BoostLoader';

import { addBoostSomeone, addAdmin, sendBoostCredential } from '../boost/boostHelpers';
import {
    useCreateBoost,
    useCreateChildBoost,
    useEditBoostMeta,
    useGetCurrentLCNUser,
    useWallet,
    CredentialCategoryEnum,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import {
    getNetworkIDPayload,
    getScoutIDPayload,
    TroopsCMSEditorModeEnum,
    TroopsCMSState,
    TroopsCMSViewModeEnum,
} from './troopCMSState';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { LCNBoostStatusEnum } from '../boost/boost';
import { useAddCredentialToWallet } from '../boost/mutations';
import { getPermissionsByRole } from './troops.helpers';
import { cloneDeep } from 'lodash';

const StateValidator = z.object({
    name: z.string().min(1, 'Name is required!'),
    description: z.string().min(1, 'Description is required!'),
});

const TroopStateValidator = z.object({
    troopNumber: z.number().min(0),
    description: z.string().min(1, 'Description is required!'),
});

type TroopsCMSProps = {
    parentUri?: string;
    viewMode: TroopsCMSViewModeEnum;
    editorMode?: TroopsCMSEditorModeEnum;
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    handleCloseModal: () => void;
    isParentBoostLoading?: boolean;
    onSuccess?: (boostUri?: string, state?: TroopsCMSState) => void;
    editBoostUri?: string;
    scoutBoostUri?: string; // used to add Scouts during edit
};

export const TroopsCMS: React.FC<TroopsCMSProps> = ({
    // oxlint-disable-next-line no-unused-vars
    parentUri,
    viewMode,
    editorMode = TroopsCMSEditorModeEnum.create,
    state,
    setState,
    handleCloseModal,
    isParentBoostLoading,
    onSuccess,
    editBoostUri,
    scoutBoostUri,
}) => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const { mutateAsync: createBoost } = useCreateBoost();
    const { mutateAsync: createChildBoost } = useCreateChildBoost();
    const { mutateAsync: editBoost } = useEditBoostMeta();
    const { mutate: addCredentialToWallet } = useAddCredentialToWallet();

    const [activeTab, setActiveTab] = useState<TroopsCMSTabsEnum>(TroopsCMSTabsEnum.content);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPublishLoading, setIsPublishLoading] = useState<boolean>(false);
    // oxlint-disable-next-line no-unused-vars
    const [isSaveLoading, setIsSaveLoading] = useState<boolean>(false);

    const _description = state?.inheritNetworkContent
        ? state?.parentID?.basicInfo?.description
        : state?.basicInfo.description;

    const isEdit = editorMode === TroopsCMSEditorModeEnum.edit;

    const validate = () => {
        const parsedData =
            viewMode === TroopsCMSViewModeEnum.troop
                ? TroopStateValidator.safeParse({
                      troopNumber: state?.basicInfo.name,
                      description: _description,
                  })
                : StateValidator.safeParse({
                      name: state?.basicInfo.name,
                      description: _description,
                  });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const handleIssueBoost = async (
        wallet: BespokeLearnCard,
        boostUri: string,
        profileIDs: string[]
    ) => {
        try {
            // oxlint-disable-next-line no-unused-vars
            const uris = await Promise.all(
                profileIDs.map(async profileId => {
                    // handle self boosting
                    console.log('profileId', profileId);
                    console.log('currentLCNUser?.profileId', currentLCNUser?.profileId);
                    if (profileId === currentLCNUser?.profileId) {
                        // oxlint-disable-next-line no-unused-vars
                        const { sentBoost, sentBoostUri } = await sendBoostCredential(
                            wallet,
                            profileId,
                            boostUri
                        );

                        console.log('sentBoost', sentBoost);

                        const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(
                            sentBoost
                        );
                        await addCredentialToWallet({ uri: issuedVcUri });
                        return issuedVcUri;
                    }
                    // handle boosting someone else
                    const issuedVc = await addBoostSomeone(wallet, profileId, boostUri);
                    return issuedVc;
                })
            );
        } catch (e) {
            setIsLoading(false);
            console.error('handleIssueBoost::error', e);
        }
    };

    // oxlint-disable-next-line no-unused-vars
    const handleAddAdmins = async (
        wallet: BespokeLearnCard,
        boostUri: string,
        admins: string[]
    ) => {
        try {
            if (admins?.length > 0) {
                await Promise.all(
                    admins?.map(async admin => {
                        if (admin === currentLCNUser?.profileId) {
                            // the creator is already an admin
                            return;
                        }
                        const adminForBoost = await addAdmin(wallet, boostUri, admin);
                        return adminForBoost;
                    })
                );
            }
        } catch (e) {
            console.error('handleAddAdmins::error', e);
        }
    };

    // oxlint-disable-next-line no-unused-vars
    const handleUpdatePermissions = async (
        wallet: BespokeLearnCard,
        boostUri: string,
        profileIDs: string[],
        permissionRole: TroopsCMSViewModeEnum
    ) => {
        const updates = getPermissionsByRole(permissionRole);

        try {
            await Promise.all(
                profileIDs.map(async profileId => {
                    if (profileId === currentLCNUser?.profileId) {
                        // dont update permissions for the creator
                        return;
                    }
                    await wallet.invoke.updateBoostPermissions(boostUri, { ...updates }, profileId);
                })
            );
        } catch (error) {
            console.log('handleUpdatePermissions::error', error);
        }
    };

    const handlePublishBoosts = async () => {
        if (!validate()) {
            // return the user to the content tab to fix the errors
            setActiveTab(TroopsCMSTabsEnum.content);
            return;
        }

        const wallet = await initWallet();

        const currentUserProfileID = currentLCNUser?.profileId ?? '';

        let admins: string[] = state?.admins?.map(admin => admin?.profileId) ?? [];

        let members: string[] = state?.issueTo?.map(member => member?.profileId) ?? [];

        const networkIDPayload = getNetworkIDPayload(state, viewMode);

        const networkMeta = (() => {
            const nf = state?.networkFields ?? {};
            const n: Record<string, any> = {};
            if (nf.networkType) n.networkType = nf.networkType;
            if (nf.country) n.country = nf.country;
            if (nf.region) n.region = nf.region;
            if (nf.organization) n.organization = nf.organization;
            return Object.keys(n).length ? { network: n } : undefined;
        })();

        try {
            if (viewMode === TroopsCMSViewModeEnum.global) {
                setIsPublishLoading(true);
                admins = [...admins, currentUserProfileID];
                console.log('networkIDPayload', networkIDPayload);
                // create boost
                const { boostUri } = await createBoost({
                    state: networkIDPayload,
                    status: LCNBoostStatusEnum.live,
                    defaultClaimPermissions: getPermissionsByRole(TroopsCMSViewModeEnum.global),
                    ...(networkMeta ? { meta: networkMeta } : {}),
                });

                console.log('boostUri', boostUri);
                // oxlint-disable-next-line no-extra-non-null-assertion
                console.log('boost', await wallet.invoke.getBoost(boostUri!));
                console.log('admins', admins);

                if (boostUri) {
                    if (admins?.length > 0) {
                        // issue boost to admins
                        await handleIssueBoost(wallet, boostUri, admins);

                        // add as admins
                        // await handleAddAdmins(wallet, boostUri, admins); // permissions will be handled by defaultClaimPermissions
                    }
                }

                setIsPublishLoading(false);
                handleCloseModal();
                return;
            } else if (viewMode === TroopsCMSViewModeEnum.network) {
                setIsPublishLoading(true);
                admins = [...admins, currentUserProfileID];
                // create boost
                const { boostUri } = await createChildBoost({
                    parentUri: state?.parentID?.boostUri, // globalID URI
                    state: networkIDPayload, // networkID
                    status: LCNBoostStatusEnum.live,
                    defaultClaimPermissions: getPermissionsByRole(TroopsCMSViewModeEnum.network),
                    ...(networkMeta ? { meta: networkMeta } : {}),
                });

                try {
                    //Create claim hook for networkId
                    // oxlint-disable-next-line no-unused-vars
                    const claimHook = await wallet.invoke.createClaimHook({
                        type: 'GRANT_PERMISSIONS',
                        data: {
                            claimUri: boostUri,
                            targetUri: state?.parentID?.boostUri,
                            permissions: {
                                canIssueChildren: JSON.stringify({
                                    category: {
                                        $nin: [CredentialCategoryEnum.nationalNetworkAdminId],
                                    },
                                }),
                            },
                        },
                    });
                } catch (e) {
                    console.error('Create network claim hook error', e);
                }

                if (boostUri) {
                    if (admins?.length > 0) {
                        // issue boost to admins
                        await handleIssueBoost(wallet, boostUri, admins);

                        // add as admins
                        // await handleAddAdmins(wallet, boostUri, admins);
                    }
                }
                setIsPublishLoading(false);
                handleCloseModal();
                return;
            } else if (viewMode === TroopsCMSViewModeEnum.troop) {
                const memberIDPayload = getScoutIDPayload(state, state?.memberID, viewMode);

                setIsPublishLoading(true);
                const { boostUri: troopIdUri } = await createChildBoost({
                    parentUri: state?.parentID?.boostUri, // network URI
                    state: networkIDPayload, // troopID
                    status: LCNBoostStatusEnum.live,
                    defaultClaimPermissions: getPermissionsByRole(TroopsCMSViewModeEnum.troop),
                    autoConnectRecipients: true,
                    ...(networkMeta ? { meta: networkMeta } : {}),
                });
                const { boostUri: scoutIdUri } = await createChildBoost({
                    parentUri: troopIdUri, // troop URI
                    state: memberIDPayload, // scoutID
                    status: LCNBoostStatusEnum.live,
                    defaultClaimPermissions: getPermissionsByRole(TroopsCMSViewModeEnum.member),
                    autoConnectRecipients: true,
                    ...(networkMeta ? { meta: networkMeta } : {}),
                });

                //Create claim hook for troop leader id
                try {
                    // oxlint-disable-next-line no-unused-vars
                    const claimHook = await wallet.invoke.createClaimHook({
                        type: 'GRANT_PERMISSIONS',
                        data: {
                            claimUri: troopIdUri,
                            targetUri: state?.parentID?.boostUri,
                            permissions: { canIssueChildren: '*' },
                        },
                    });
                } catch (e) {
                    console.error('Create claim hook error', e);
                }

                try {
                    //Create claim hook for scoutId
                    // oxlint-disable-next-line no-unused-vars
                    const claimHook2 = await wallet.invoke.createClaimHook({
                        type: 'GRANT_PERMISSIONS',
                        data: {
                            claimUri: scoutIdUri,
                            targetUri: state?.parentID?.boostUri,
                            permissions: { canIssueChildren: '*' },
                        },
                    });
                } catch (e) {
                    console.error('Create claim hook error', e);
                }

                if (troopIdUri) {
                    if (admins?.length > 0) {
                        // issue boost to admins
                        await handleIssueBoost(wallet, troopIdUri, admins);

                        // add as admins
                        // await handleAddAdmins(wallet, troopIdUri, admins);
                    }
                }

                if (scoutIdUri) {
                    if (members?.length > 0) {
                        // issue boost to scouts
                        await handleIssueBoost(wallet, scoutIdUri, members);
                    }
                }
                setIsPublishLoading(false);
                handleCloseModal();
                onSuccess?.(state?.parentID?.boostUri, state);
                return;
            }
        } catch (e) {
            setIsPublishLoading(false);
            console.error('handlePublishBoost::error', e);
            presentToast(`Error issuing boost`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleEditBoost = async () => {
        if (!validate()) {
            // return the user to the content tab to fix the errors
            setActiveTab(TroopsCMSTabsEnum.content);
            return;
        }

        const wallet = await initWallet();

        let adminsToAdd: string[] =
            state?.admins?.filter(a => !a.unremovable).map(admin => admin?.profileId) ?? [];
        let membersToAdd: string[] =
            state?.issueTo?.filter(m => !m.unremovable).map(member => member?.profileId) ?? [];

        if (!editBoostUri) return;

        try {
            setIsPublishLoading(true);

            const _state = cloneDeep(state);
            if (viewMode === TroopsCMSViewModeEnum.troop) {
                const troopName = `Troop ${state.basicInfo.name}`;
                _state.basicInfo.name = troopName;

                if (_state.memberID) {
                    _state.memberID.basicInfo.name = troopName;
                }
            }

            const networkMeta = (() => {
                const nf = _state?.networkFields ?? {};
                const n: Record<string, unknown> = {};
                if (nf.networkType) n.networkType = nf.networkType;
                if (nf.country) n.country = nf.country;
                if (nf.region) n.region = nf.region;
                if (nf.organization) n.organization = nf.organization;
                return Object.keys(n).length ? { network: n } : undefined;
            })();

            // oxlint-disable-next-line no-unused-vars
            const success = await editBoost({
                boostUri: editBoostUri,
                state: _state,
                ...(networkMeta ? { meta: networkMeta } : {}),
            });

            if (adminsToAdd.length > 0) {
                await handleIssueBoost(wallet, editBoostUri, adminsToAdd);
            }

            if (scoutBoostUri) {
                // oxlint-disable-next-line no-unused-vars
                const success = await editBoost({
                    boostUri: scoutBoostUri,
                    state: {
                        ..._state.memberID,
                        basicInfo: {
                            ..._state.basicInfo,
                            name: _state.basicInfo.name,
                            description: _state.basicInfo.description,
                        },
                    },
                    ...(networkMeta ? { meta: networkMeta } : {}),
                });

                if (membersToAdd.length > 0) {
                    await handleIssueBoost(wallet, scoutBoostUri, membersToAdd);
                }
            }

            setIsPublishLoading(false);
            onSuccess?.(editBoostUri, state);
            handleCloseModal();
        } catch (e) {
            setIsPublishLoading(false);
            console.error('handleEditBoost::error', e);
            presentToast(`Error editing boost`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <IonPage>
            {(isLoading || isSaveLoading || isPublishLoading) && (
                <BoostLoader text={'Loading...'} darkBackground />
            )}
            <TroopsCMSHeader
                state={state}
                setState={setState}
                viewMode={viewMode}
                editorMode={editorMode}
                isParentBoostLoading={isParentBoostLoading}
            />
            <TroopsCMSLayout state={state} viewMode={viewMode}>
                <TroopsCMSThumbnail viewMode={viewMode} state={state} />
                <div className="bg-white ion-padding rounded-[20px] shadow-soft-bottom">
                    <TroopsCMSTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                    {activeTab === TroopsCMSTabsEnum.content ? (
                        <TroopCMSContentForm
                            errors={errors}
                            setErrors={setErrors}
                            viewMode={viewMode}
                            state={state}
                            setState={setState}
                        />
                    ) : (
                        <TroopsAppearanceForm
                            viewMode={viewMode}
                            state={state}
                            setState={setState}
                        />
                    )}
                </div>

                <TroopsIDTypeSelector viewMode={viewMode} state={state} setState={setState} />
            </TroopsCMSLayout>
            <TroopsCMSFooter
                viewMode={viewMode}
                activeTab={activeTab}
                handleCloseModal={handleCloseModal}
                handlePublishBoosts={isEdit ? handleEditBoost : handlePublishBoosts}
                state={state}
                editorMode={editorMode}
            />
        </IonPage>
    );
};

export default TroopsCMS;
