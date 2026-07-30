import {
    SKILL_PROFILE_GOALS_KEY,
    SKILL_PROFILE_PROFESSIONAL_TITLE_KEY,
    SKILL_PROFILE_ROLE_EXPERIENCE_KEY,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep1';
import { SKILL_PROFILE_WORK_HISTORY_KEY } from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep2.constants';
import { SKILL_PROFILE_SALARY_KEY } from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep3';
import {
    SKILL_PROFILE_JOB_STABILITY_KEY,
    SKILL_PROFILE_WORK_LIFE_BALANCE_KEY,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep4';

export const VERIFIABLE_DATA_KEY_BY_CATEGORY: Partial<Record<string, string>> = {
    Goals: SKILL_PROFILE_GOALS_KEY,
    'Professional Title': SKILL_PROFILE_PROFESSIONAL_TITLE_KEY,
    'Role Experience': SKILL_PROFILE_ROLE_EXPERIENCE_KEY,
    'Work Experience': SKILL_PROFILE_WORK_HISTORY_KEY,
    'Pay Rate': SKILL_PROFILE_SALARY_KEY,
    'Work Life Balance': SKILL_PROFILE_WORK_LIFE_BALANCE_KEY,
    'Job Stability': SKILL_PROFILE_JOB_STABILITY_KEY,
};
