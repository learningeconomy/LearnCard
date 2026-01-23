import cloneDeep from 'lodash/cloneDeep';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isVC2Format } from '@learncard/helpers';
import {
    BoostCategoryOptionsEnum,
    // oxlint-disable-next-line no-unused-vars
    CredentialCategoryEnum,
    getBaseUrl,
    switchedProfileStore,
    useDeleteCredentialRecord,
    useGetProfile,
    useGetSelfAssignedSkillsBoost,
    useGetSelfAssignedSkillsCredential,
    useWallet,
    VC_WITH_URI,
} from 'learn-card-base';
import {
    VC,
    VCValidator,
    UnsignedVP,
    // oxlint-disable-next-line no-unused-vars
    Boost,
    BoostPermissions,
    UnsignedVC,
    LCNBoostStatusEnum,
} from '@learncard/types';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { BoostCMSState } from 'learn-card-base/components/boost/boost';
import {
    getDefaultCategoryForCredential,
    getEndorsementsForVC,
} from 'learn-card-base/helpers/credentialHelpers';
import { insertItem } from './mutation.helpers';
import { convertAttachmentsToEvidence } from '../../components/boost/boost';
import { v4 as uuidv4 } from 'uuid';

type SharedCredentialsIndex = {
    type: 'shared-credentials';
    sharedCredentialUri: string;
    pin: string;
    randomSeed: string;
    uri: string;
};

export const baseBoostShareRouteName = 'share-boost';

const baseUrl = getBaseUrl();
/* creates a VP that wraps a boost, returns a published vp and a sharable link*/
export const useShareBoostMutation = () => {
    const { initWallet } = useWallet();

    return useMutation({
        mutationFn: async ({
            credential,
            credentialUri,
        }: {
            credential: VC | UnsignedVC;
            credentialUri: string;
        }) => {
            // get current index data stored on ceramic for user
            // currentUser's wallet
            const myWallet = await initWallet();

            const pin = Math.floor(Math.random() * 9000 + 1000)?.toString();

            let currentIndex = await myWallet.invoke.learnCloudRead<SharedCredentialsIndex>({
                sharedCredentialUri: credentialUri,
            });

            //Find if credential is already stored in index, if so return that instead
            const extantCredentialIndex = currentIndex?.length > 0 && currentIndex[0];

            const endorsementVCs: VC[] = await getEndorsementsForVC(myWallet, credential, 'public');

            //If it already exists than we don't have to do it all again....
            if (extantCredentialIndex && endorsementVCs.length === 0) {
                const link = `https://${baseUrl}/${baseBoostShareRouteName}?uri=${extantCredentialIndex?.uri}&seed=${extantCredentialIndex?.randomSeed}&pin=${extantCredentialIndex?.pin}`;
                return {
                    link,
                };
            }

            //If this credential doesn't exist in the sharedCredentials inded then go through this flow
            // Generate random seed
            const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(30)), dec =>
                dec.toString(16).padStart(2, '0')
            ).join('');

            const walletSeed = `${randomKey}${pin}`;

            //init throwaway wallet
            const wallet = await getBespokeLearnCard(walletSeed);

            const myWalletDid = myWallet.id.did();

            // ! boostID causes an issue with the vp schema
            // ! which is attached thru the useGetCredentialWithEdits(cred) hook
            // ! removing the boostID generates the share link as expected
            delete credential.boostID;

            const isVC2 = isVC2Format(credential);

            // create a VP
            const vp: UnsignedVP = {
                '@context': [
                    isVC2
                        ? 'https://www.w3.org/ns/credentials/v2'
                        : 'https://www.w3.org/2018/credentials/v1',
                    'https://ctx.learncard.com/boosts/1.0.1.json',
                ],
                type: ['VerifiablePresentation'],
                holder: myWalletDid,
                verifiableCredential:
                    endorsementVCs?.length > 0 ? [credential, ...endorsementVCs] : [credential],
            };

            // issue presentation
            const issuedVp = await myWallet.invoke.issuePresentation(vp);

            // Publish VP to Ceramic (encrypted)
            const publishedVpUri = await myWallet.store.LearnCloud.uploadEncrypted?.(issuedVp, {
                recipients: [wallet.id.did()],
            });

            if (!publishedVpUri) throw new Error('Unable to publish VP');

            await myWallet.invoke.learnCloudCreate<SharedCredentialsIndex>({
                sharedCredentialUri: credentialUri,
                pin,
                randomSeed: randomKey,
                uri: publishedVpUri,
                type: 'shared-credentials',
            });
            const link = `https://${baseUrl}/${baseBoostShareRouteName}?uri=${publishedVpUri}&seed=${randomKey}&pin=${pin}`;

            return {
                link,
            };
        },
    });
};

// TODO: Make sure that name is set when calling this!
export const useCreateBoost = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            parentUri,
            state,
            status,
            defaultClaimPermissions,
            skillIds,
            meta,
            autoConnectRecipients,
        }: {
            parentUri?: string | undefined;
            state: BoostCMSState;
            status: LCNBoostStatusEnum;
            defaultClaimPermissions?: BoostPermissions;
            skillIds?: { frameworkId: string; id: string; proficiencyLevel?: number }[]; // Framework skill references for automatic alignment
            meta?: Record<string, unknown>;
            autoConnectRecipients?: boolean;
        }) => {
            const wallet = await initWallet();

            const walletDid = wallet?.id?.did();
            const currentDate = new Date()?.toISOString();
            const expirationDate = state?.basicInfo?.expirationDate
                ? new Date(state?.basicInfo?.expirationDate).toISOString()
                : undefined;

            const evidence = convertAttachmentsToEvidence(state?.mediaAttachments);

            const credentialPayload: Record<string, any> = {
                subject: walletDid,
                issuanceDate: currentDate,
                boostName: state?.basicInfo?.name,
                achievementType: state?.basicInfo?.achievementType,
                achievementDescription: state?.basicInfo?.description,
                achievementNarrative: state?.basicInfo?.narrative,
                achievementName: state?.basicInfo?.name,
                boostImage: state?.appearance?.badgeThumbnail,
                achievementImage: state?.appearance?.badgeThumbnail,
                expirationDate: expirationDate,
                evidence, // ! attachments are deprecated in favor of evidence
                display: {
                    backgroundColor: state?.appearance?.backgroundColor,
                    backgroundImage: state?.appearance?.backgroundImage,
                    displayType: state?.appearance?.displayType ?? 'badge',
                    previewType: state?.appearance?.previewType ?? 'default',

                    // Troops 2.0 fields
                    fadeBackgroundImage: state?.appearance?.fadeBackgroundImage,
                    repeatBackgroundImage: state?.appearance?.repeatBackgroundImage,

                    // family emoji
                    emoji: {
                        activeSkinTone: state?.appearance?.emoji?.activeSkinTone ?? '',
                        unified: state?.appearance?.emoji?.unified ?? '',
                        unifiedWithoutSkinTone:
                            state?.appearance?.emoji?.unifiedWithoutSkinTone ?? '',
                        names: state?.appearance?.emoji?.names ?? [],
                        imageUrl: state?.appearance?.emoji?.imageUrl ?? '',
                    },
                },
                skills: state?.skills ?? [],
                // attachments: state?.mediaAttachments,
                address: state?.address,
                boostID: {
                    fontColor: state?.appearance?.fontColor,
                    accentColor: state?.appearance?.accentColor,
                    backgroundImage: state?.appearance?.idBackgroundImage,
                    dimBackgroundImage: state?.appearance?.dimIdBackgroundImage,
                    issuerThumbnail: state?.appearance?.idIssuerThumbnail,
                    showIssuerThumbnail: state?.appearance?.showIdIssuerImage,
                    IDIssuerName: state?.basicInfo?.issuerName,

                    idThumbnail: state?.appearance?.idThumbnail,
                    accentFontColor: state?.appearance?.accentFontColor,
                    idBackgroundColor: state?.appearance?.idBackgroundColor,
                    repeatIdBackgroundImage: state?.appearance?.repeatIdBackgroundImage,
                    idDescription: state?.appearance?.idDescription,
                },
            };

            if (
                state?.basicInfo?.memberTitles?.guardians &&
                state?.basicInfo?.memberTitles?.dependents
            ) {
                credentialPayload.familyTitles = state?.basicInfo?.memberTitles;
            }

            if (
                state?.basicInfo?.type === BoostCategoryOptionsEnum.id ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.membership ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.globalAdminId ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.nationalNetworkAdminId ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.troopLeaderId ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.scoutId
            ) {
                credentialPayload.type = 'boostID';
            } else {
                delete credentialPayload.address;
                delete credentialPayload.boostID;
                credentialPayload.type = 'boost';
            }

            const unsignedCredential = wallet.invoke.newCredential(credentialPayload as any);

            // // Set OBv3 alignments if we have any (from state.alignments or legacy state.skills)
            // try {
            //     const alignments = (state as any)?.alignments;
            //     if (alignments && alignments.length > 0) {
            //         unsignedCredential.credentialSubject = unsignedCredential.credentialSubject ?? {};
            //         unsignedCredential.credentialSubject.achievement =
            //             unsignedCredential.credentialSubject.achievement ?? {};
            //         unsignedCredential.credentialSubject.achievement.alignment = alignments;
            //     }
            // } catch (e) {
            //     console.warn('Failed to set alignments on unsignedCredential', e);
            // }

            /// CREATE BOOST
            let boostUri;
            if (!parentUri) {
                // makes request to LCN, second param is metadata associated with template
                // metadata is used to categorize etc
                // skillIds will auto-attach framework and align these skills
                boostUri = await wallet.invoke.createBoost(unsignedCredential, {
                    name: state?.basicInfo?.name,
                    type: state?.basicInfo.achievementType ?? '',
                    category: state?.basicInfo?.type,
                    status,
                    claimPermissions: defaultClaimPermissions,
                    skills: skillIds, // Backend will handle framework attachment and alignment
                    ...(autoConnectRecipients === true ? { autoConnectRecipients: true } : {}),
                    ...(meta ? { meta } : {}),
                });
            }

            if (parentUri) {
                /// CREATE CHILD BOOST

                // makes request to LCN, second param is metadata associated with template
                // metadata is used to categorize etc
                // skillIds will auto-attach framework and align these skills
                boostUri = await wallet.invoke.createChildBoost(parentUri, unsignedCredential, {
                    name: state?.basicInfo?.name,
                    type: state?.basicInfo.achievementType ?? '',
                    category: state?.basicInfo?.type,
                    status,
                    claimPermissions: defaultClaimPermissions,
                    skills: skillIds,
                    ...(autoConnectRecipients === true ? { autoConnectRecipients: true } : {}),
                    ...(meta ? { meta } : {}),
                });
            }

            return {
                boostUri,
                name: state.basicInfo.name,
                type: state.basicInfo.achievementType ?? '',
                category: state.basicInfo.type,
                status,
            };
        },
        onSuccess: async ({ boostUri, name, type, category, status }) => {
            await queryClient.cancelQueries({
                queryKey: ['useGetPaginatedManagedBoosts', category],
            });
            const wallet = await initWallet();

            // update cache optimistically
            insertItem(queryClient, ['useGetPaginatedManagedBoosts', category], {
                uri: boostUri,
                name,
                type,
                category,
                status,
            });

            // Intentionally don't await these to keep this mutation fast!

            queryClient.refetchQueries({ queryKey: ['useGetPaginatedManagedBoosts', category] });
            queryClient.invalidateQueries({ queryKey: ['useGetPaginatedFamilialBoosts'] });
            queryClient.invalidateQueries({ queryKey: ['useGetBoostChildren'] });
            queryClient.invalidateQueries({ queryKey: ['useCountBoostChildren'] });

            queryClient.invalidateQueries({
                queryKey: ['currentUserTroopIds'],
            });

            wallet.invoke.resolveFromLCN(boostUri).then(async boost => {
                const validationResult = await VCValidator.spa(boost);

                if (validationResult.success) {
                    queryClient.setQueryData<VC>(
                        ['useResolveBoost', boostUri],
                        validationResult.data
                    );
                }
            });
        },
    });
};

// TODO: Make sure that name is set when calling this!
export const useCreateChildBoost = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            parentUri,
            state,
            status,
            defaultClaimPermissions,
            meta,
            autoConnectRecipients,
        }: {
            parentUri: string;
            state: BoostCMSState;
            status: LCNBoostStatusEnum;
            defaultClaimPermissions?: BoostPermissions;
            meta?: Record<string, unknown>;
            autoConnectRecipients?: boolean;
        }) => {
            const wallet = await initWallet();

            const walletDid = wallet?.id?.did();
            const currentDate = new Date()?.toISOString();
            const expirationDate = state?.basicInfo?.expirationDate
                ? new Date(state?.basicInfo?.expirationDate).toISOString()
                : undefined;

            const credentialPayload: Record<string, any> = {
                subject: walletDid,
                issuanceDate: currentDate,
                boostName: state?.basicInfo?.name,
                achievementType: state?.basicInfo?.achievementType,
                achievementDescription: state?.basicInfo?.description,
                achievementNarrative: state?.basicInfo?.narrative,
                achievementName: state?.basicInfo?.name,
                boostImage: state?.appearance?.badgeThumbnail,
                achievementImage: state?.appearance?.badgeThumbnail,
                expirationDate: expirationDate,
                display: {
                    backgroundColor: state?.appearance?.backgroundColor,
                    backgroundImage: state?.appearance?.backgroundImage,
                    displayType: state?.appearance?.displayType ?? '',

                    // Troops 2.0 fields
                    fadeBackgroundImage: state?.appearance?.fadeBackgroundImage,
                    repeatBackgroundImage: state?.appearance?.repeatBackgroundImage,
                },
                attachments: state?.mediaAttachments,
                address: state?.address,
                boostID: {
                    fontColor: state?.appearance?.fontColor,
                    accentColor: state?.appearance?.accentColor,
                    backgroundImage: state?.appearance?.idBackgroundImage,
                    dimBackgroundImage: state?.appearance?.dimIdBackgroundImage,
                    issuerThumbnail: state?.appearance?.idIssuerThumbnail,
                    showIssuerThumbnail: state?.appearance?.showIdIssuerImage,
                    IDIssuerName: state?.basicInfo?.issuerName,

                    // Troops 2.0 fields
                    idThumbnail: state?.appearance?.idThumbnail,
                    accentFontColor: state?.appearance?.accentFontColor,
                    idBackgroundColor: state?.appearance?.idBackgroundColor,
                    repeatIdBackgroundImage: state?.appearance?.repeatIdBackgroundImage,
                    idDescription: state?.appearance?.idDescription,
                },
            };

            if (
                state?.basicInfo?.type === BoostCategoryOptionsEnum.id ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.membership ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.globalAdminId ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.nationalNetworkAdminId ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.troopLeaderId ||
                state?.basicInfo?.type === BoostCategoryOptionsEnum.scoutId
            ) {
                credentialPayload.type = 'boostID';
            } else {
                delete credentialPayload.address;
                delete credentialPayload.boostID;
                credentialPayload.type = 'boost';
            }

            const unsignedCredential = wallet.invoke.newCredential(credentialPayload as any);

            /// CREATE CHILD BOOST

            // makes request to LCN, second param is metadata associated with template
            // metadata is used to categorize etc
            const boostUri = await wallet.invoke.createChildBoost(parentUri, unsignedCredential, {
                name: state?.basicInfo?.name,
                type: state?.basicInfo.achievementType ?? '',
                category: state?.basicInfo?.type,
                status,
                claimPermissions: defaultClaimPermissions,
                ...(autoConnectRecipients === true ? { autoConnectRecipients: true } : {}),
                ...(meta ? { meta } : {}),
            });

            return {
                boostUri,
                name: state.basicInfo.name,
                type: state.basicInfo.achievementType ?? '',
                category: state.basicInfo.type,
                status,
            };
        },
        onSuccess: async ({ boostUri, name, type, category, status }) => {
            await queryClient.invalidateQueries({
                queryKey: ['useGetBoostChildren'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['useCountBoostChildren'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['useCountFamilialBoosts'],
            });

            await queryClient.invalidateQueries({
                queryKey: ['useGetPaginatedBoostChildren'],
            });

            await queryClient.invalidateQueries({
                queryKey: ['currentUserTroopIds'],
            });

            await queryClient.cancelQueries({
                queryKey: ['useGetPaginatedManagedBoosts', category],
            });
            const wallet = await initWallet();

            // update cache optimistically
            insertItem(queryClient, ['useGetPaginatedManagedBoosts', category], {
                uri: boostUri,
                name,
                type,
                category,
                status,
            });

            // Intentionally don't await these to keep this mutation fast!
            queryClient.refetchQueries({ queryKey: ['useGetPaginatedManagedBoosts', category] });
            wallet.invoke.resolveFromLCN(boostUri).then(async boost => {
                const validationResult = await VCValidator.spa(boost);

                if (validationResult.success) {
                    queryClient.setQueryData<VC>(
                        ['useResolveBoost', boostUri],
                        validationResult.data
                    );
                }
            });
        },
    });
};

export const useManageSelfAssignedSkillsBoost = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const { data: profile } = useGetProfile();
    const { data: sasBoost, isLoading: isLoadingSasBoost } = useGetSelfAssignedSkillsBoost();
    const { data: sasCred, isLoading: isLoadingSasCred } = useGetSelfAssignedSkillsCredential();

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();

    return useMutation({
        mutationFn: async ({
            skills,
        }: {
            skills?: { frameworkId: string; id: string; proficiencyLevel?: number }[];
        }) => {
            if (isLoadingSasBoost || isLoadingSasCred) {
                console.log('Loading self-assigned skills boost/credential... please try again.');
                return { boostUri: undefined };
            }
            if (!profile) {
                console.log('No profile found, please try again.');
                return { boostUri: undefined };
            }

            const wallet = await initWallet();

            const sasBoostExists = !!sasBoost;

            const walletDid = wallet?.id?.did();
            const currentDate = new Date()?.toISOString();

            const achievementType = 'ext:SelfAssignedSkills';

            const credentialPayload: Record<string, any> = {
                subject: walletDid,
                type: 'boost',
                issuanceDate: currentDate,
                boostName: 'Self-Assigned Skills',
                achievementType: achievementType, // e.g. "ext: Attendance"
                achievementDescription:
                    'A self-attested credential that lists the skills you have.',
                achievementNarrative: '',
                achievementName: 'Self-Assigned Skills',
                // boostImage: '',
                // achievementImage: '',
                // expirationDate: expirationDate,
                display: {
                    // backgroundColor: undefined,
                    // backgroundImage: undefined,
                    displayType: 'badge',
                    previewType: 'default',

                    // Troops 2.0 fields
                    // fadeBackgroundImage: undefined,
                    // repeatBackgroundImage: undefined,

                    // family emoji
                    // emoji: {
                    //     activeSkinTone: '',
                    //     unified: '',
                    //     unifiedWithoutSkinTone: '',
                    //     names: [],
                    //     imageUrl: '',
                    // },
                },
            };

            const unsignedCredential = wallet.invoke.newCredential(credentialPayload as any);

            // console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');
            // console.log('unsignedCredential:', unsignedCredential);
            // console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
            // console.log('skills:', skills);

            let boostUri;

            if (sasBoostExists) {
                const updatedBoostBoolean = await wallet?.invoke?.updateBoost(sasBoost.uri, {
                    name: 'Self-Assigned Skills',
                    type: achievementType, // in boost CMS: 'ext:Artowork'
                    category: CredentialCategoryEnum.skill, // in boost CMS: "Achievement", "Accomplishment", etc.
                    status: 'PROVISIONAL',
                    credential: unsignedCredential,
                    skills,
                });

                boostUri = sasBoost.uri;

                await deleteCredentialRecord(sasCred?.record);
            } else {
                /// CREATE BOOST
                // makes request to LCN, second param is metadata associated with template
                // metadata is used to categorize etc
                // skillIds will auto-attach framework and align these skills
                boostUri = await wallet.invoke.createBoost(unsignedCredential, {
                    name: 'Self-Assigned Skills',
                    type: achievementType,
                    category: CredentialCategoryEnum.skill,
                    status: 'PROVISIONAL',
                    skills,
                });
            }

            // TODO issue the credential
            const sentCredentialUri = await wallet?.invoke?.sendBoost(
                profile?.profileId,
                boostUri,
                {
                    skipNotification: true,
                    encrypt: true,
                }
            );

            const sentCredential = await wallet?.read?.get(sentCredentialUri);
            const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(sentCredential);

            // addCredentialToWallet
            const vc = await VCValidator.parseAsync(await wallet.read.get(issuedVcUri));

            const category = getDefaultCategoryForCredential(vc) || 'Skill';

            const res = await wallet.index.LearnCloud.add({
                id: uuidv4(),
                uri: issuedVcUri,
                category,
                title: 'Self-Assigned Skills',
            });

            return {
                boostUri,
                // name: state.basicInfo.name,
                // type: state.basicInfo.achievementType ?? '',
                // category: state.basicInfo.type,
                // status,
            };
        },
        onSuccess: async ({ boostUri }) => {
            const switchedDid = switchedProfileStore.get.switchedDid();
            queryClient.invalidateQueries({
                queryKey: ['selfAssignedSkillsBoost', switchedDid ?? ''],
            });
            queryClient.invalidateQueries({
                queryKey: ['selfAssignedSkillsCredential', switchedDid ?? ''],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetSkills', switchedDid ?? ''],
            });
            queryClient.refetchQueries({
                queryKey: ['selfAssignedSkillsBoost', switchedDid ?? ''],
            });
            queryClient.refetchQueries({
                queryKey: ['selfAssignedSkillsCredential', switchedDid ?? ''],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetSkills', switchedDid ?? ''],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetBoostSkills', boostUri],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetBoostSkills', boostUri],
            });
        },
    });
};

export const useEditBoostMeta = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            boostUri,
            state,
            meta,
        }: {
            boostUri: string;
            state: BoostCMSState;
            meta?: Record<string, unknown>;
        }) => {
            const wallet = await initWallet();

            const {
                name,
                description,

                // famiily exclusive
                memberTitles,
            } = state.basicInfo;

            const {
                accentColor,
                accentFontColor,
                backgroundColor,
                backgroundImage,
                badgeThumbnail,
                dimBackgroundImage,
                dimIdBackgroundImage,
                fadeBackgroundImage,
                fontColor,
                idBackgroundColor,
                idBackgroundImage,
                idDescription,
                idIssuerThumbnail,
                idThumbnail,
                issuerThumbnail,
                repeatBackgroundImage,
                repeatIdBackgroundImage,
                inheritNetworkContent,

                // famiily exclusive
                emoji,
            } = state.appearance;

            const edits = {
                name,
                description,
                accentColor,
                accentFontColor,
                backgroundColor,
                backgroundImage,
                badgeThumbnail,
                dimBackgroundImage,
                dimIdBackgroundImage,
                fadeBackgroundImage,
                fontColor,
                idBackgroundColor,
                idBackgroundImage,
                idDescription: inheritNetworkContent ? description : idDescription,
                idIssuerThumbnail,
                idThumbnail,
                issuerThumbnail, // not used?
                repeatBackgroundImage,
                repeatIdBackgroundImage,

                // famiily exclusive
                emoji,
                memberTitles,
            };
            const metaEditsObject = { meta: { ...(meta ?? {}), edits } };

            // oxlint-disable-next-line no-unused-vars
            const success = await wallet.invoke.updateBoost(boostUri, metaEditsObject);

            return { boostUri, metaEditsObject };
        },
        // onSuccess: async ({ boostUri, name, type, category, status }) => {
        onSuccess: async ({ boostUri, metaEditsObject }) => {
            const queryKey = ['useGetBoost', boostUri];

            const cachedBoost = queryClient.getQueryData(queryKey);

            const updatedBoost = {
                ...cachedBoost,
                meta: {
                    ...cachedBoost.meta,
                    ...metaEditsObject.meta,
                },
            };

            queryClient.setQueryData(queryKey, updatedBoost);
        },
    });
};

export const useDeleteManagedBoostMutation = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ boostUri, category }: { boostUri: string; category: string }) => {
            const wallet = await initWallet();

            await wallet.invoke.deleteBoost(boostUri);

            return { boostUri, category };
        },
        onMutate: async update => {
            const { boostUri, category } = update;
            // get cached query useGetResolvedBoostsFromCategory
            await queryClient.cancelQueries({
                queryKey: ['useGetResolvedBoostsFromCategory', category],
            });

            const currentQuery = queryClient.getQueryData([
                'useGetResolvedBoostsFromCategory',
                category,
            ]);

            // update cache optimistically
            // remove from useGetCredentials cache
            if (currentQuery) {
                // construct updated payload
                const updatedQuery = currentQuery?.filter(boost => {
                    return boost?.boost?.uri !== boostUri;
                });

                // write to cache
                queryClient.setQueryData(
                    ['useGetResolvedBoostsFromCategory', category],
                    updatedQuery
                );
            }

            /*
                clean up paginatedManagedBoosts
            */
            await queryClient.cancelQueries({
                queryKey: ['useGetPaginatedManagedBoosts', category],
            });

            queryClient.setQueryData<{
                pages: Array<{
                    cursor: string;
                    hasMore: boolean;
                    records: Array<any>;
                }>;
                pageParams: Array<string | null>;
            }>(['useGetPaginatedManagedBoosts', category], old => {
                if (!old) return old;

                const newPages = old.pages.map(page => ({
                    ...page,
                    records: page.records.filter(record => record.uri !== boostUri),
                }));

                return {
                    ...old,
                    pages: newPages,
                };
            });
            /*
                clean up paginatedManagedBoosts
            */

            return { currentQuery }; //use in OnError
        },
        // oxlint-disable-next-line no-unused-vars
        onSuccess: (res, variables) => {
            // oxlint-disable-next-line no-unused-vars
            const { boostUri, category } = res;
            queryClient.invalidateQueries({
                queryKey: ['useGetResolvedBoostsFromCategory', category],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetPaginatedManagedBoosts', category],
            });
            queryClient.invalidateQueries({ queryKey: ['boosts'] });
        },
    });
};

// oxlint-disable-next-line no-unused-vars
type IndexItem = {
    pin: string;
    uri: string;
    credential: string;
    randomSeed: string;
};

export const useDeleteEarnedBoostMutation = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ boostUri, category }) => {
            try {
                const wallet = await initWallet();
                // Preemptively empty LC cache
                await wallet.cache.flushIndex();
                /// Delete from index
                // find id in index records based on uri
                // based on URI since the id stored in IDX is not consistently derived from VC itself

                const LearnCloudIndex = await wallet.index.LearnCloud.get({ category });

                const foundLCIndex = LearnCloudIndex?.find(index => {
                    return index?.uri === boostUri;
                });

                const sqliteIndex = await wallet.index.SQLite?.get?.().catch(console.error);
                const foundIndex = sqliteIndex?.find(index => {
                    return index?.uri === boostUri;
                });

                // why wallet.index.all.remove does not work?
                // oxlint-disable-next-line no-unused-vars
                const res2 = foundIndex?.id
                    ? await wallet.index.SQLite?.remove?.(foundIndex.id)
                    : undefined;
                // oxlint-disable-next-line no-unused-vars
                const res3 = foundLCIndex?.id
                    ? await wallet.index.LearnCloud.remove(foundLCIndex.id)
                    : undefined;

                //Also "unBoost" (not implemented atm, need to add LCA endpoint to handle this)
                //todo

                return {
                    boostUri,
                    category,
                };
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
        onMutate: async update => {
            const { boostUri, category } = update;
            const didWeb = switchedProfileStore.get.switchedDid();

            await queryClient.cancelQueries({
                queryKey: ['useGetCredentials', didWeb ?? '', category],
            });
            await queryClient.cancelQueries({
                queryKey: ['useGetCredentialList', didWeb ?? '', category],
            });
            await queryClient.cancelQueries({
                queryKey: ['boosts'],
            });
            await queryClient.cancelQueries({
                queryKey: ['useGetIDs', didWeb],
            });

            const currentQuery = queryClient.getQueryData([
                'useGetCredentials',
                didWeb ?? '',
                category,
                true,
            ]);
            const currentQueryList = queryClient.getQueryData([
                'useGetCredentialList',
                didWeb ?? '',
                category,
            ]);
            const currentIDQueryList = queryClient.getQueryData(['useGetIDs', didWeb ?? '']);

            // update cache optimistically
            // remove from useGetCredentials cache
            if (currentQuery || currentQueryList || currentIDQueryList) {
                // construct updated payload
                const updatedQuery = currentQuery?.filter(index => {
                    return index?.uri !== boostUri;
                });

                const updatedQueryList = cloneDeep(currentQueryList);

                if ((updatedQueryList as any)?.pages?.[0]?.records) {
                    (updatedQueryList as any).pages[0].records = (
                        updatedQueryList as any
                    ).pages[0].records.filter(index => {
                        return index.uri !== boostUri;
                    });
                }

                const oldStaleTime =
                    queryClient.getQueryDefaults([
                        'useGetCredentials',
                        didWeb ?? '',
                        category,
                        true,
                    ]).staleTime ?? 0;
                const oldListStaleTime =
                    queryClient.getQueryDefaults(['useGetCredentialList', didWeb ?? '', category])
                        .staleTime ?? 0;

                queryClient.setQueryDefaults(['useGetCredentials', didWeb ?? '', category, true], {
                    staleTime: Infinity,
                });
                queryClient.setQueryDefaults(['useGetCredentialList', didWeb ?? '', category], {
                    staleTime: Infinity,
                });

                // write to cache
                queryClient.setQueryData(
                    ['useGetCredentials', didWeb ?? '', category, true],
                    updatedQuery
                );
                queryClient.setQueryData(
                    ['useGetCredentialList', didWeb ?? '', category],
                    updatedQueryList
                );

                queryClient.setQueryData(
                    ['useGetIDs', didWeb ?? ''],
                    (oldData: (VC | VC_WITH_URI)[] = []) =>
                        oldData.filter(credential => credential.uri !== boostUri)
                );

                return { currentQuery, oldStaleTime, oldListStaleTime }; //use in OnError
            }
            return { currentQuery }; //use in OnError
        },
        // oxlint-disable-next-line no-unused-vars
        onSuccess: (res, variables) => {
            // oxlint-disable-next-line no-unused-vars
            const { boostUri, category } = res;
            const didWeb = switchedProfileStore.get.switchedDid();

            queryClient.invalidateQueries({
                queryKey: ['useGetCredentials', didWeb ?? '', category],
            });
            queryClient.invalidateQueries({ queryKey: ['boosts'] });
            queryClient.invalidateQueries({
                queryKey: ['useGetCredentialList', didWeb ?? '', category],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetCredentialCount', didWeb ?? '', category],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetIDs', didWeb ?? ''],
            });
        },
        onSettled: (data, error, variables, context) => {
            const didWeb = switchedProfileStore.get.switchedDid();
            if (context?.oldStaleTime !== undefined) {
                queryClient.setQueryDefaults(
                    ['useGetCredentials', didWeb ?? '', data?.category, true],
                    {
                        staleTime: context.oldStaleTime,
                    }
                );
            }
            if (context?.oldListStaleTime !== undefined) {
                queryClient.setQueryDefaults(
                    ['useGetCredentialList', didWeb ?? '', data?.category],
                    {
                        staleTime: context.oldListStaleTime,
                    }
                );
            }
        },
    });
};
