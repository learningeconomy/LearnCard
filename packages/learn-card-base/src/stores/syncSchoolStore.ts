import { filterMaybes } from '@learncard/helpers';
import { VC } from '@learncard/types';
import { createStore } from '@udecode/zustood';
import { EntryVC, CourseMetaVC } from 'learn-card-base/types/credentials';

export interface SelectedCredential {
    selected?: boolean | undefined;
    credential: any;
}

export interface VCsAndMeta {
    credentials: SelectedCredential[];
    allSelected?: boolean;
}

export interface SyncCredentialsVCs {
    ids: VC[];
    skills: VC[];
    courses: CourseMetaVC[];
    courseEntries: EntryVC[];
    achievements: VC[];
    workHistory: VC[];
    socialBadges: VC[];
    memberships: VC[];
    families: VC[];
}

export const initialSyncSchoolState: SyncSchoolStoreState = {
    selectAll: null,
    selectedAllIdsToggle: null,
    selectedAllAchievementsToggle: null,
    selectedAllSkillsToggle: null,
    selectedAllCoursesToggle: null,
    selectedCourseIds: null,
    selectedSkillIds: null,
    selectedAchievementIds: null,
    selectedIdIds: null,
    allVcIds: null,
    courseCountTotal: null,
    skillCountTotal: null,
    achievementCountTotal: null,
    idCountTotal: null,
    credentials: null,
};

export type SyncSchoolStoreState = {
    selectAll: boolean | null;
    selectedAllIdsToggle: boolean | null;
    selectedAllAchievementsToggle: boolean | null;
    selectedAllSkillsToggle: boolean | null;
    selectedAllCoursesToggle: boolean | null;
    selectedCourseIds: string[] | undefined | null;
    selectedSkillIds: string[] | undefined | null;
    selectedAchievementIds: string[] | undefined | null;
    selectedIdIds: string[] | undefined | null;
    allVcIds: string[] | undefined | null;
    courseCountTotal: number | undefined | null;
    skillCountTotal: number | undefined | null;
    achievementCountTotal: number | undefined | null;
    idCountTotal: number | undefined | null;
    credentials: SyncCredentialsVCs | undefined | null;
};

export const syncSchoolStore =
    createStore('syncSchoolStore')<SyncSchoolStoreState>(initialSyncSchoolState);

export default syncSchoolStore;

// used to resest a specific category in the store
export const resetSyncStoreSelectedIds = (
    achievementType: 'skill' | 'achievement' | 'id' | 'course' | 'all',
    resetType: 'empty' | 'fill'
) => {
    const _credentials = syncSchoolStore.get.credentials();
    const allSkillIds = filterMaybes(_credentials?.skills.map(cred => cred?.id));
    const allCourseIds = filterMaybes(_credentials?.courses.map(cred => cred?.id));
    const allAchievementIds = filterMaybes(_credentials?.achievements.map(cred => cred?.id));
    const allIdIds = filterMaybes(_credentials?.ids.map(cred => cred?.id));

    switch (achievementType) {
        case 'course':
            if (resetType === 'fill') {
                syncSchoolStore.set.selectedCourseIds(allCourseIds);
            }
            if (resetType === 'empty') {
                syncSchoolStore.set.selectedCourseIds([]);
            }
            break;
        case 'achievement':
            if (resetType === 'fill') {
                syncSchoolStore.set.selectedAchievementIds(allAchievementIds);
            }
            if (resetType === 'empty') {
                syncSchoolStore.set.selectedAchievementIds([]);
            }
            break;
        case 'skill':
            if (resetType === 'fill') {
                syncSchoolStore.set.selectedSkillIds(allSkillIds);
            }
            if (resetType === 'empty') {
                syncSchoolStore.set.selectedSkillIds([]);
            }
            break;
        case 'id':
            if (resetType === 'fill') {
                syncSchoolStore.set.selectedIdIds(allIdIds);
            }
            if (resetType === 'empty') {
                syncSchoolStore.set.selectedIdIds([]);
            }
            break;
        case 'all':
            if (resetType === 'fill') {
                syncSchoolStore.set.selectedCourseIds(allCourseIds);
                syncSchoolStore.set.selectedSkillIds(allSkillIds);
                syncSchoolStore.set.selectedAchievementIds(allAchievementIds);
                syncSchoolStore.set.selectedIdIds(allIdIds);
            }
            if (resetType === 'empty') {
                syncSchoolStore.set.selectedCourseIds([]);
                syncSchoolStore.set.selectedSkillIds([]);
                syncSchoolStore.set.selectedAchievementIds([]);
                syncSchoolStore.set.selectedIdIds([]);
            }
            break;

        default:
            break;
    }
};
