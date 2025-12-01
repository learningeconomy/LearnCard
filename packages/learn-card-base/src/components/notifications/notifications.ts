import moment from 'moment';
import { VC } from '@learncard/types';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import {
    AchievementCategoryTypes,
    IdCategoryTypes,
    SkillCategroyTypes,
    LearnHistoryCategoryTypes,
    WorkHistoryCategoryTypes,
    SocialBadgesCategoryTypes,
    MeritBadgesCategoryTypes,
} from '../IssueVC/constants';
import {
    getCategoryTypeFromCustomType,
    isCustomBoostType,
} from 'learn-card-base/helpers/boostCustomTypeHelpers';
import { BoostCategoryOptionsEnum } from 'learn-card-base';

export enum NotificationTypeEnum {
    Currency = 'currency',
    ID = 'id',
    Achievement = 'achievement',
    Skill = 'skill',
    Job = 'job',
    Learning = 'learning',
    SocialBadge = 'socialBadge',
    MeritBadge = 'meritBadge',
}

// temporary helper, since all VCs are achievements atm
export const getNotificationFromVC = (vc: VC, uri: string, from: string) => {
    const _vc = unwrapBoostCredential(vc);

    return {
        title: _vc?.credentialSubject?.achievement?.name,
        issuerImage: _vc?.credentialSubject?.achievement?.image,
        issuerName: _vc?.issuer,
        notificationType:
            getNotificationType(_vc?.credentialSubject?.achievement?.achievementType) ||
            NotificationTypeEnum.Achievement,
        issueDate: moment(_vc?.issuanceDate).format('MMM DD YYYY'),
        uri,
        from,
    };
};

// helper for mapping credential achievement type -> notification type
export const getNotificationType = (
    achievementType: NotificationTypeEnum | string
): NotificationTypeEnum => {
    let customTypeCategory: string | undefined = '';

    if (isCustomBoostType(achievementType)) {
        customTypeCategory = getCategoryTypeFromCustomType(achievementType);
    }

    if (
        AchievementCategoryTypes.includes(achievementType) ||
        customTypeCategory === BoostCategoryOptionsEnum.achievement
    )
        return NotificationTypeEnum.Achievement;
    if (
        IdCategoryTypes.includes(achievementType) ||
        customTypeCategory === BoostCategoryOptionsEnum.id
    )
        return NotificationTypeEnum.ID;
    if (
        SkillCategroyTypes.includes(achievementType) ||
        customTypeCategory === BoostCategoryOptionsEnum.skill
    )
        return NotificationTypeEnum.Skill;
    if (
        LearnHistoryCategoryTypes.includes(achievementType) ||
        customTypeCategory === BoostCategoryOptionsEnum.learningHistory
    )
        return NotificationTypeEnum.Learning;
    if (
        WorkHistoryCategoryTypes.includes(achievementType) ||
        customTypeCategory === BoostCategoryOptionsEnum.workHistory
    )
        return NotificationTypeEnum.Job;
    if (
        SocialBadgesCategoryTypes.includes(achievementType) ||
        customTypeCategory === BoostCategoryOptionsEnum.socialBadge
    )
        return NotificationTypeEnum.SocialBadge;
    if (
        MeritBadgesCategoryTypes.includes(achievementType) ||
        customTypeCategory === BoostCategoryOptionsEnum.meritBadge
    )
        return NotificationTypeEnum.MeritBadge;

    return NotificationTypeEnum.Achievement;
};
