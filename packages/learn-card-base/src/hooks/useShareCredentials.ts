import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    selectedCredsStore,
    SelectedCredsStoreState,
    useWallet,
    contractCategoryNameToCategoryMetadata,
} from 'learn-card-base';
import {
    getAllSortedCredentials,
    getDefaultCategoryForCredential,
    isBoostCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { filterMaybes } from '@learncard/helpers';
import { SortedCredentials } from 'learn-card-base/stores/selectedCredsStore';
import { VC } from '@learncard/types';
import {
    useGetCredentialsPaginated,
    type VC_WITH_URI,
} from 'learn-card-base/react-query/queries/vcQueries';

export const VC_TYPE = {
    ID: 'ids',
    SOCIAL_BADGE: 'socialBadges',
    ACHIEVEMENT: 'achievements',
    WORK: 'workHistory',
    COURSE: 'courses',
    SKILL: 'skills',
    QUALIFICATIONS: 'qualifications',
} as const;

export type VcType = (typeof VC_TYPE)[keyof typeof VC_TYPE];

import { getLogger } from '../logging/logger';
const log = getLogger('use-share-credentials');

export const useShareCredentials = (
    preSelectedCredentials?: VC[],
    skipReloadCredentials: boolean = false,
    initialCredentials?: VC[]
) => {
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string>();
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();

    const { data: walletCredentials, isLoading: vcsFromWalletLoading } = useGetCredentialsPaginated(
        undefined,
        initialCredentials,
        true
    );
    const { vcsFromWallet, indexedCategories } = useMemo(() => {
        const indexedCategories = new Map<VC, string>();
        const vcsFromWallet = walletCredentials?.map(item => {
            if ('vc' in item) {
                const record = item as VC_WITH_URI;
                if (record.category) indexedCategories.set(record.vc, record.category);
                return record.vc;
            }
            return item as VC;
        });
        return { vcsFromWallet, indexedCategories };
    }, [walletCredentials]);

    const credentials = selectedCredsStore.useTracked.credentials();

    const vcMap: {
        [vcType in VcType]: {
            selectedIds: string[];
            setIds: (ids: string[]) => void;
        };
    } = {
        [VC_TYPE.COURSE]: {
            selectedIds: selectedCredsStore.useTracked.selectedCourseIds() ?? [],
            setIds: (ids: string[]) => selectedCredsStore.set.selectedCourseIds(ids),
        },
        [VC_TYPE.ID]: {
            selectedIds: selectedCredsStore.useTracked.selectedIdIds() ?? [],
            setIds: (ids: string[]) => selectedCredsStore.set.selectedIdIds(ids),
        },
        [VC_TYPE.ACHIEVEMENT]: {
            selectedIds: selectedCredsStore.useTracked.selectedAchievementIds() ?? [],
            setIds: (ids: string[]) => selectedCredsStore.set.selectedAchievementIds(ids),
        },
        [VC_TYPE.SKILL]: {
            selectedIds: selectedCredsStore.useTracked.selectedSkillIds() ?? [],
            setIds: (ids: string[]) => selectedCredsStore.set.selectedSkillIds(ids),
        },
        [VC_TYPE.WORK]: {
            selectedIds: selectedCredsStore.useTracked.selectedWorkHistoryIds() ?? [],
            setIds: (ids: string[]) => selectedCredsStore.set.selectedWorkHistoryIds(ids),
        },
        [VC_TYPE.QUALIFICATIONS]: {
            selectedIds: selectedCredsStore.useTracked.selectedQualificationIds() ?? [],
            setIds: (ids: string[]) => selectedCredsStore.set.selectedQualificationIds(ids),
        },
        [VC_TYPE.SOCIAL_BADGE]: {
            selectedIds: selectedCredsStore.useTracked.selectedSocialBadgeIds() ?? [],
            setIds: (ids: string[]) => selectedCredsStore.set.selectedSocialBadgeIds(ids),
        },
    };

    const vcCounts: {
        [vcType in VcType]: {
            totalCount: number;
            selectedCount: number;
        };
    } = {
        [VC_TYPE.COURSE]: {
            totalCount: credentials?.courses?.length ?? 0,
            selectedCount: vcMap[VC_TYPE.COURSE]?.selectedIds?.length ?? 0,
        },
        [VC_TYPE.ID]: {
            totalCount: credentials?.ids?.length ?? 0,
            selectedCount: vcMap[VC_TYPE.ID]?.selectedIds?.length ?? 0,
        },
        [VC_TYPE.ACHIEVEMENT]: {
            totalCount: credentials?.achievements?.length ?? 0,
            selectedCount: vcMap[VC_TYPE.ACHIEVEMENT].selectedIds?.length ?? 0,
        },
        [VC_TYPE.SKILL]: {
            totalCount: credentials?.skills?.length ?? 0,
            selectedCount: vcMap[VC_TYPE.SKILL]?.selectedIds?.length ?? 0,
        },
        [VC_TYPE.WORK]: {
            totalCount: credentials?.workHistory?.length ?? 0,
            selectedCount: vcMap[VC_TYPE.WORK]?.selectedIds?.length ?? 0,
        },
        [VC_TYPE.QUALIFICATIONS]: {
            totalCount: credentials?.qualifications?.length ?? 0,
            selectedCount: vcMap[VC_TYPE.QUALIFICATIONS]?.selectedIds?.length ?? 0,
        },
        [VC_TYPE.SOCIAL_BADGE]: {
            totalCount: credentials?.socialBadges?.length ?? 0,
            selectedCount: vcMap[VC_TYPE.SOCIAL_BADGE]?.selectedIds?.length ?? 0,
        },
    };

    let totalCredentialsCount = 0,
        totalSelectedCount = 0,
        allSelectedCredentialIds: string[] = [];

    Object.values(VC_TYPE).forEach(vcKey => {
        totalCredentialsCount += vcCounts[vcKey].totalCount;
        totalSelectedCount += vcCounts[vcKey].selectedCount;
        allSelectedCredentialIds = allSelectedCredentialIds.concat(vcMap[vcKey].selectedIds);
    });

    // allSelected is a boolean value tracking if the select all top level button state
    const allSelected = totalCredentialsCount === totalSelectedCount;

    const getAllSelected = (type: VcType) => {
        // we need some delicate handling here because GenericCardWrapper changes the check state when this value changes (to something other than null)
        //  e.g.
        //   - you have credential A and B selected + selectAll set to true
        //   - you click B (unselecting it) -> if selectAll gets set to false, then A will updated to be unchecked
        //     - instead we need selectAll to get set to null so that A doesn't get changed
        const numSelected = vcCounts[type].selectedCount;
        const total = vcCounts[type].totalCount;
        if (numSelected === total) return true;
        else if (numSelected === 0) return false;
        else return null;
    };

    // helper to get a unique id because the id field is always http://example.com/credentials/3527 right now
    const getUniqueId = (credential: VC, moreUniqueness: any = '') => {
        // this is causing the all selected ids array to be undefined-undefined-undefined-undefined for me when creating a boost bundle....
        // i think maybe a diff approuch could be a deterministically generated uuid with a seed maybe
        //   - we'll compromise 😜
        if (credential.id && credential.id !== 'http://example.com/credentials/3527') {
            return `${credential.id}`;
        } else {
            return `${credential.id}-${credential.proof?.proofValue}-${credential.issuanceDate}${
                moreUniqueness ? `-${moreUniqueness}` : ''
            }`;
        }
    };

    const getVcsByType = (type: VcType) => {
        return credentials?.[type];
    };
    /* const getVcById = (vcId: string, type: VcType) => {
    return credentials?.[type].find(cred => getUniqueId(cred) === vcId);
} */

    const getCredentialIdsForType = (
        credentials: SortedCredentials | undefined | null,
        type: VcType
    ): string[] => {
        if (!credentials || !Object.keys(credentials).includes(type)) return [];

        const filteredCreds = filterMaybes(credentials[type].map(cred => getUniqueId(cred)));
        return filteredCreds;
    };

    const loadCredentials = async () => {
        (async () => {
            if (vcsFromWalletLoading) return;

            // INITIALIZE INITIAL STATE
            // add to sync store state that keeps track ids, _courses, _achievements, _skills
            try {
                if (errorMessage) setErrorMessage(undefined);
                setLoading(true);
                // edge case for some old credentials that for some reason don't have an id field at all!! :o
                const fixedCreds = vcsFromWallet?.map((cred: VC) => {
                    if (!cred?.id) {
                        cred.id = 'http://example.com/credentials/3527';
                        // maybe change this so its a uri with a uuid attached?
                    }
                    return cred;
                });

                //dedupe credentials - doesn't make much sense to display if same
                // perhaps should be handled on backend so they aren't added if dupicliate in the first place
                //  Fixed the lack of id issue by using the new version of getUniqueId
                const duplicate = new Set();
                const dedupedCredentials = fixedCreds?.filter((cred: VC) => {
                    const uniqueId = getUniqueId(cred);
                    const duplicated = duplicate.has(uniqueId);
                    duplicate.add(uniqueId);
                    return !duplicated;
                });

                const wallet = await initWallet();
                const resolveCategory = async (credential: VC): Promise<string> => {
                    const indexedCategory = indexedCategories.get(credential);
                    if (indexedCategory) return indexedCategory;

                    const fallbackCategory = getDefaultCategoryForCredential(credential);
                    const boostUri =
                        credential.boostId ?? unwrapBoostCredential(credential)?.boostId;
                    if (!isBoostCredential(credential) || !boostUri) return fallbackCategory;

                    try {
                        const boost = await queryClient.fetchQuery({
                            queryKey: ['useGetBoost', boostUri],
                            queryFn: () => wallet.invoke.getBoost(boostUri),
                            staleTime: 60_000,
                        });
                        return boost?.category
                            ? (contractCategoryNameToCategoryMetadata(boost.category)
                                  ?.credentialType ?? boost.category)
                            : fallbackCategory;
                    } catch (error) {
                        log.warn('Failed to resolve boost for share categorization', error);
                        return fallbackCategory;
                    }
                };
                const walletCredentialIds = new Set(
                    (dedupedCredentials ?? []).map(credential => getUniqueId(credential))
                );
                const preselected = preSelectedCredentials ?? [];
                const sortingInput = [
                    ...(dedupedCredentials ?? []),
                    ...preselected.filter(
                        credential => !walletCredentialIds.has(getUniqueId(credential))
                    ),
                ];
                const sortedAllCredentials = await getAllSortedCredentials(
                    sortingInput,
                    resolveCategory
                );
                const walletOnly = (items: VC[]) =>
                    items.filter(credential => walletCredentialIds.has(getUniqueId(credential)));
                const sortedCredentials = {
                    ids: walletOnly(sortedAllCredentials.ids),
                    courses: walletOnly(sortedAllCredentials.courses),
                    workHistory: walletOnly(sortedAllCredentials.workHistory),
                    achievements: walletOnly(sortedAllCredentials.achievements),
                    skills: walletOnly(sortedAllCredentials.skills),
                    socialBadges: walletOnly(sortedAllCredentials.socialBadges),
                    qualifications: walletOnly(sortedAllCredentials.qualifications),
                    memberships: walletOnly(sortedAllCredentials.memberships),
                    families: walletOnly(sortedAllCredentials.families),
                };

                let allSkillIds,
                    allCourseIds,
                    allAchievementIds,
                    allIdIds,
                    allWorkHistoryIds,
                    allQualificationIds,
                    allSocialBadgeIds;
                if (preSelectedCredentials) {
                    const selectedIds = new Set(
                        preSelectedCredentials.map(credential => getUniqueId(credential))
                    );
                    const idsFor = (type: keyof typeof sortedAllCredentials) =>
                        sortedAllCredentials[type]
                            ?.filter(credential => selectedIds.has(getUniqueId(credential)))
                            .map(credential => getUniqueId(credential));
                    allSkillIds = idsFor('skills');
                    allCourseIds = idsFor('courses');
                    allAchievementIds = idsFor('achievements');
                    allIdIds = idsFor('ids');
                    allWorkHistoryIds = idsFor('workHistory');
                    allQualificationIds = idsFor('qualifications');
                    allSocialBadgeIds = idsFor('socialBadges');
                } else {
                    allSkillIds = getCredentialIdsForType(sortedCredentials, VC_TYPE.SKILL);
                    allCourseIds = getCredentialIdsForType(sortedCredentials, VC_TYPE.COURSE);
                    allAchievementIds = getCredentialIdsForType(
                        sortedCredentials,
                        VC_TYPE.ACHIEVEMENT
                    );
                    allIdIds = getCredentialIdsForType(sortedCredentials, VC_TYPE.ID);
                    allWorkHistoryIds = getCredentialIdsForType(sortedCredentials, VC_TYPE.WORK);
                    allQualificationIds = getCredentialIdsForType(
                        sortedCredentials,
                        VC_TYPE.QUALIFICATIONS
                    );
                    allSocialBadgeIds = getCredentialIdsForType(
                        sortedCredentials,
                        VC_TYPE.SOCIAL_BADGE
                    );
                }

                const allCredentialIds = filterMaybes(
                    vcsFromWallet?.map(cred => getUniqueId(cred)) ?? []
                );

                // shape data to store data shape
                const initialSyncState: SelectedCredsStoreState = {
                    selectedCourseIds: allCourseIds,
                    selectedSkillIds: allSkillIds,
                    selectedAchievementIds: allAchievementIds,
                    selectedIdIds: allIdIds,
                    selectedWorkHistoryIds: allWorkHistoryIds,
                    selectedQualificationIds: allQualificationIds,
                    selectedSocialBadgeIds: allSocialBadgeIds,
                    allVcIds: allCredentialIds || null,
                    credentials: sortedCredentials,
                };

                selectedCredsStore.set.state(() => initialSyncState);
                setLoading(false);
            } catch (e) {
                log.debug('///ERROR GETTING VCS FROM WALLET', e);
                setLoading(false);
                setErrorMessage(`Error loading credentials from wallet. Please try again. ${e}`);
            }
        })();
    };

    useEffect(() => {
        if (skipReloadCredentials && credentials) return;
        loadCredentials();
    }, [preSelectedCredentials, vcsFromWalletLoading, vcsFromWallet, indexedCategories]);

    // Function that handles what happens when you hit the select all top level toggle
    const handleToggleSelectAll = () => {
        if (allSelected) {
            Object.values(VC_TYPE).forEach(vcKey => vcMap[vcKey].setIds([]));
        } else {
            // Some credentials aren't selected => select everything
            Object.values(VC_TYPE).forEach(vcKey =>
                vcMap[vcKey].setIds(getCredentialIdsForType(credentials, vcKey))
            );
        }
    };

    // What happens when you toggle the row select all for a category, e.g. skill, achievement, course
    const handleToggleSelectAllType = (type: VcType) => {
        const allSelected = getAllSelected(type);
        vcMap[type].setIds(allSelected ? [] : getCredentialIdsForType(credentials, type));
    };

    const handleVcClick = (vcId: string, type: VcType) => {
        const selectedIds = vcMap[type].selectedIds;
        const isRemove = selectedIds.includes(vcId);
        vcMap[type].setIds(
            isRemove ? selectedIds.filter(id => id !== vcId) : [...selectedIds, vcId]
        );
    };

    const getAllCredentials = (): VC[] => {
        return Object.values(VC_TYPE).reduce((acc, type) => {
            const creds = credentials?.[type] ?? [];
            return acc.concat(creds);
        }, [] as VC[]);
    };

    const getAllSelectedCredentials = (): VC[] => {
        const allCredentials = getAllCredentials();
        return allCredentials.filter((cred: VC) =>
            allSelectedCredentialIds.includes(getUniqueId(cred))
        );
    };

    const isVcSelected = (vc: VC) => {
        return allSelectedCredentialIds.includes(getUniqueId(vc));
    };

    return {
        credentials,
        allSelectedCredentialIds,
        totalCredentialsCount,
        totalSelectedCount,
        allSelected,
        handleToggleSelectAll,
        handleToggleSelectAllType,
        handleVcClick,
        loading: skipReloadCredentials && credentials ? false : loading,
        errorMessage,
        vcMap,
        vcCounts,
        getVcsByType,
        getAllSelected,
        getUniqueId,
        getAllCredentials,
        getAllSelectedCredentials,
        isVcSelected,
    };
};

export default useShareCredentials;
