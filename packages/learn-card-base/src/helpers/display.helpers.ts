import { CredentialCategoryEnum } from 'learn-card-base';

import { BadgeDisplayIcon } from '../svgs/displayTypes/BadgeDisplayIcon';
import { CertificateDisplayIcon } from '../svgs/displayTypes/CertificateDisplayIcon';
import { IDDisplayIcon } from '../svgs/displayTypes/IDDisplayIcon';
import { CourseDisplayIcon } from '../svgs/displayTypes/CourseDisplayIcon';
import { AwardDisplayIcon } from '../svgs/displayTypes/AwardDisplayIcon';
import {
    AttachmentDocIcon,
    AttachmentPhotoIcon,
    AttachmentVideoIcon,
    AttachmentAudioIcon,
    AttachmentPdfDocIcon,
} from '../svgs/attachmentTypes/attachmentIcons';
import { BoostMediaOptionsEnum } from 'learn-card-base/components/boost/boost';

export enum DisplayTypeEnum {
    Badge = 'badge',
    Certificate = 'certificate',
    ID = 'id',
    Course = 'course',
    Award = 'award',
    Media = 'media',
}

export enum PreviewTypeEnum {
    Default = 'default',
    Media = 'media',
}

export const getDefaultDisplayType = (category: string): DisplayTypeEnum => {
    if (category === CredentialCategoryEnum.accomplishment) {
        return DisplayTypeEnum.Media;
    }

    if (
        category === CredentialCategoryEnum.socialBadge ||
        category === CredentialCategoryEnum.workHistory
    ) {
        return DisplayTypeEnum.Badge;
    }

    if (category === CredentialCategoryEnum.id || category === CredentialCategoryEnum.membership) {
        return DisplayTypeEnum.ID;
    }

    if (
        category === CredentialCategoryEnum.achievement ||
        category === CredentialCategoryEnum.accommodation ||
        category === CredentialCategoryEnum.learningHistory
    ) {
        return DisplayTypeEnum.Certificate;
    }

    return DisplayTypeEnum.Badge;
};

export const getDisplayIcon = (
    displayType: DisplayTypeEnum,
    version?: string
): React.FC<{ className?: string; version?: string }> => {
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

export const getAttachmentTypeIcon = (
    attachmentType: BoostMediaOptionsEnum,
    fileType?: string
): { AttachmentIcon: React.FC<{ className?: string; version?: string }>; title?: string } => {
    switch (attachmentType) {
        case BoostMediaOptionsEnum.photo:
            return { AttachmentIcon: AttachmentPhotoIcon, title: 'Image' };
        case BoostMediaOptionsEnum.document:
            return {
                AttachmentIcon: fileType === 'PDF' ? AttachmentPdfDocIcon : AttachmentDocIcon,
                title: fileType,
            };
        case BoostMediaOptionsEnum.video:
            return { AttachmentIcon: AttachmentVideoIcon, title: 'Video' };
        default:
            return { AttachmentIcon: AttachmentDocIcon, title: 'Attachment' };
    }
};
