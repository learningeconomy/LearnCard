import Camera from 'learn-card-base/svgs/Camera';
import Document from 'learn-card-base/svgs/Document';
import Video from 'learn-card-base/svgs/Video';
import LinkChain from 'learn-card-base/svgs/LinkChain';

export enum EndorsementFormModeEnum {
    create = 'create',
    edit = 'edit',
    review = 'review',
}

export enum EndorsementMediaOptionsEnum {
    photo = 'photo',
    document = 'document',
    video = 'video',
    link = 'link',
}

export enum EndorsementRelationshipOptionsEnum {
    Friend = 'friend',
    ProfessionalColleague = 'professional-colleague',
    VolunteeredTogether = 'volunteered-together',
    College = 'college',
    Other = 'other',
}

export type EndorsementRelationshipType = {
    label: string;
    type: EndorsementRelationshipOptionsEnum | string | null;
};

export type EndorsementMediaAttachment = {
    title: string | null;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    url: string | null; // upload URL
    type: EndorsementMediaOptionsEnum | string | null; // link, document, photo, video
};

export type EndorsementState = {
    description: string;
    qualification: string;
    mediaAttachments: EndorsementMediaAttachment[];
    relationship: EndorsementRelationshipType | null;
};

export type EndorsementMediaOptionsType = {
    id: number;
    type: EndorsementMediaOptionsEnum;
    title: string;
    color: string;
    Icon: React.FC<{ className?: string }>;
};

export const endorsementMediaOptions: EndorsementMediaOptionsType[] = [
    {
        id: 1,
        type: EndorsementMediaOptionsEnum.photo,
        title: 'Photo',
        color: 'cyan-700',
        Icon: Camera,
    },
    {
        id: 2,
        type: EndorsementMediaOptionsEnum.document,
        title: 'Document',
        color: 'emerald-700',
        Icon: Document,
    },
    {
        id: 3,
        type: EndorsementMediaOptionsEnum.video,
        title: 'Video',
        color: 'rose-600',
        Icon: Video,
    },
    {
        id: 4,
        type: EndorsementMediaOptionsEnum.link,
        title: 'Link',
        color: 'indigo-600',
        Icon: LinkChain,
    },
];

export const relationshipOptions = [
    {
        id: 1,
        label: 'Friend',
        type: EndorsementRelationshipOptionsEnum.Friend,
    },
    {
        id: 2,
        label: 'Professional Colleague',
        type: EndorsementRelationshipOptionsEnum.ProfessionalColleague,
    },
    {
        id: 3,
        label: 'Volunteered Together',
        type: EndorsementRelationshipOptionsEnum.VolunteeredTogether,
    },
    {
        id: 4,
        label: 'College',
        type: EndorsementRelationshipOptionsEnum.College,
    },
    {
        id: 5,
        label: 'Other',
        type: EndorsementRelationshipOptionsEnum.Other,
    },
];

export const initialEndorsementState: EndorsementState = {
    description: '',
    qualification: '',
    mediaAttachments: [],
    relationship: null,
};

export type EndorsementEvidence = {
    id?: string;
    type: [string, ...string[]]; // Changed from string[] to ensure at least one element
    name?: string;
    narrative?: string;
    description?: string;
    genre?: string;
    audience?: string;

    fileName?: string;
    fileType?: string;
    fileSize?: string;
};

export const convertAttachmentsToEvidence = (
    attachments: EndorsementMediaAttachment[] = []
): EndorsementEvidence[] => {
    return attachments
        .filter(att => att.url && att.type)
        .map(att => {
            const evidence: EndorsementEvidence = {
                id: att.url || undefined,
                type: ['Evidence', 'EvidenceFile'] as [string, ...string[]],
                name: att.title || att.fileName || undefined,
                genre: att.type || undefined,

                // TODO: Add file information back when https://github.com/learningeconomy/LearnCard/pull/824 is merged
                // fileName: att.fileName || undefined,
                // fileType: att.fileType || undefined,
                // fileSize: att.fileSize || undefined,
            };

            return evidence;
        });
};
