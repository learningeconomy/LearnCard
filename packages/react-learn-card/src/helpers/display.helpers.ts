import { LCCategoryEnum } from '../types';

import { BadgeDisplayIcon } from '../components/svgs/BadgeDisplayIcon';
import { CertificateDisplayIcon } from '../components/svgs/CertificateDisplayIcon';
import { IDDisplayIcon } from '../components/svgs/IDDisplayIcon';
import { CourseDisplayIcon } from '../components/svgs/CourseDisplayIcon';
import { AwardDisplayIcon } from '../components/svgs/AwardDisplayIcon';

export enum DisplayTypeEnum {
    Badge = 'badge',
    Certificate = 'certificate',
    ID = 'id',
    Course = 'course',
    Award = 'award',
}

export const getDefaultDisplayType = (category: string): DisplayTypeEnum => {
    if (category === LCCategoryEnum.socialBadge || category === LCCategoryEnum.workHistory) {
        return DisplayTypeEnum.Badge;
    }

    if (category === LCCategoryEnum.id || category === LCCategoryEnum.membership) {
        return DisplayTypeEnum.ID;
    }

    if (
        category === LCCategoryEnum.achievement ||
        category === LCCategoryEnum.accommodations ||
        category === LCCategoryEnum.accomplishments ||
        category === LCCategoryEnum.learningHistory
    ) {
        return DisplayTypeEnum.Certificate;
    }

    return DisplayTypeEnum.Badge;
};

export const getDisplayIcon = (displayType: DisplayTypeEnum): React.FC<{ className?: string }> => {
    switch (displayType) {
        case DisplayTypeEnum.Badge:
            return BadgeDisplayIcon;
        case DisplayTypeEnum.Certificate:
            return CertificateDisplayIcon;
        case DisplayTypeEnum.ID:
            return IDDisplayIcon;
        case DisplayTypeEnum.Course:
            return CourseDisplayIcon;
        case DisplayTypeEnum.Award:
            return AwardDisplayIcon;
        default:
            return BadgeDisplayIcon;
    }
};
