import { filterMaybes } from '@learncard/helpers';
import { VC } from '@learncard/types';
import { createStore } from '@udecode/zustood';
import { SyncCredentialsVCs } from './syncSchoolStore';

//todo, this is a duplicate of syncMySchoolStore, refactor to use one store

export type SortedCredentials = {
    ids: VC[];
    skills: VC[];
    courses: VC[];
    achievements: VC[];
    workHistory: VC[];
    socialBadges: VC[];
    memberships: VC[];
    families: VC[];
};

export const initialSyncState: SelectedCredsStoreState = {
    credentials: null,
    selectedCourseIds: null,
    selectedSkillIds: null,
    selectedAchievementIds: null,
    selectedIdIds: null,
    selectedWorkHistoryIds: null,
    selectedSocialBadgeIds: null,
    allVcIds: null,

    // TODO these can all be deleted when things are migrated to use useShareCredentials
    selectAll: null,
    selectedAllIdsToggle: null,
    selectedAllAchievementsToggle: null,
    selectedAllSkillsToggle: null,
    selectedAllCoursesToggle: null,
    courseCountTotal: null,
    skillCountTotal: null,
    achievementCountTotal: null,
    idCountTotal: null,
};

export type SelectedCredsStoreState = {
    selectAll: boolean | null;
    selectedAllIdsToggle: boolean | null;
    selectedAllAchievementsToggle: boolean | null;
    selectedAllSkillsToggle: boolean | null;
    selectedAllCoursesToggle: boolean | null;
    selectedCourseIds: string[] | undefined | null;
    selectedSkillIds: string[] | undefined | null;
    selectedAchievementIds: string[] | undefined | null;
    selectedIdIds: string[] | undefined | null;
    selectedWorkHistoryIds: string[] | undefined | null;
    selectedSocialBadgeIds: string[] | undefined | null;
    allVcIds: string[] | undefined | null;
    courseCountTotal: number | undefined | null;
    skillCountTotal: number | undefined | null;
    achievementCountTotal: number | undefined | null;
    idCountTotal: number | undefined | null;
    socialBadgeCountTotal: number | undefined | null;
    credentials: SyncCredentialsVCs | SortedCredentials | undefined | null;
};

export const selectedCredsStore =
    createStore('selectedCredsStore')<SelectedCredsStoreState>(initialSyncState);

export default selectedCredsStore;

// TODO this can be deleted when everything is refactored to use useShareCredentials
// used to resest a specific category in the store
export const resetSelectedCredsStoreSelectedIds = (
    achievementType:
        | 'skill'
        | 'achievement'
        | 'id'
        | 'course'
        | 'socialBadges'
        | 'workHistory'
        | 'all',
    resetType: 'empty' | 'fill'
) => {
    const _credentials = selectedCredsStore.get.credentials();
    const allSkillIds = filterMaybes(_credentials?.skills.map(cred => cred?.id));
    const allCourseIds = filterMaybes(_credentials?.courses.map(cred => cred?.id));
    const allAchievementIds = filterMaybes(_credentials?.achievements.map(cred => cred?.id));
    const allIdIds = filterMaybes(_credentials?.ids.map(cred => cred?.id));
    const allSocialBadgeIds = filterMaybes(_credentials?.socialBadges.map(cred => cred?.id));
    const allWorkHistoryIds = filterMaybes(_credentials?.workHistory.map(cred => cred?.id));

    switch (achievementType) {
        case 'course':
            if (resetType === 'fill') {
                selectedCredsStore.set.selectedCourseIds(allCourseIds);
            }
            if (resetType === 'empty') {
                selectedCredsStore.set.selectedCourseIds([]);
            }
            break;
        case 'achievement':
            if (resetType === 'fill') {
                selectedCredsStore.set.selectedAchievementIds(allAchievementIds);
            }
            if (resetType === 'empty') {
                selectedCredsStore.set.selectedAchievementIds([]);
            }
            break;
        case 'skill':
            if (resetType === 'fill') {
                selectedCredsStore.set.selectedSkillIds(allSkillIds);
            }
            if (resetType === 'empty') {
                selectedCredsStore.set.selectedSkillIds([]);
            }
            break;
        case 'id':
            if (resetType === 'fill') {
                selectedCredsStore.set.selectedIdIds(allIdIds);
            }
            if (resetType === 'empty') {
                selectedCredsStore.set.selectedIdIds([]);
            }
            break;
        case 'socialBadges':
            if (resetType === 'fill') {
                selectedCredsStore.set.selectedSocialBadgeIds(allSocialBadgeIds);
            }
            if (resetType === 'empty') {
                selectedCredsStore.set.selectedSocialBadgeIds([]);
            }
            break;
        case 'workHistory':
            if (resetType === 'fill') {
                selectedCredsStore.set.selectedWorkHistoryIds(allWorkHistoryIds);
            }
            if (resetType === 'empty') {
                selectedCredsStore.set.selectedWorkHistoryIds([]);
            }
            break;
        case 'all':
            if (resetType === 'fill') {
                selectedCredsStore.set.selectedCourseIds(allCourseIds);
                selectedCredsStore.set.selectedSkillIds(allSkillIds);
                selectedCredsStore.set.selectedAchievementIds(allAchievementIds);
                selectedCredsStore.set.selectedIdIds(allIdIds);
                selectedCredsStore.set.selectedWorkHistoryIds(allWorkHistoryIds);
                selectedCredsStore.set.selectedSocialBadgeIds(allSocialBadgeIds);
            }
            if (resetType === 'empty') {
                selectedCredsStore.set.selectedCourseIds([]);
                selectedCredsStore.set.selectedSkillIds([]);
                selectedCredsStore.set.selectedAchievementIds([]);
                selectedCredsStore.set.selectedIdIds([]);
                selectedCredsStore.set.selectedWorkHistoryIds([]);
                selectedCredsStore.set.selectedSocialBadgeIds([]);
            }
            break;

        default:
            break;
    }
};
