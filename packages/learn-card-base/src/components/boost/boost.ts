import Camera from 'learn-card-base/svgs/Camera';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import Video from 'learn-card-base/svgs/Video';
import Document from 'learn-card-base/svgs/Document';

export declare type EmojiClickData = {
    activeSkinTone: string;
    unified: string;
    unifiedWithoutSkinTone: string;
    emoji: string;
    names: string[];
    imageUrl: string;
    isCustom: boolean;
};

export type AddressSpec = {
    streetAddress?: string | undefined;
    addressLocality?: string | undefined;
    addressRegion?: string | undefined;
    addressCountry?: string | undefined;
    postalCode?: string | undefined;
    geo?: {
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
};

export enum BoostCMSStepsEnum {
    create = 'create',
    preview = 'preview',
    publish = 'publish',
    issueTo = 'issueTo',
    confirmation = 'confirmation',
}

export enum BoostMediaOptionsEnum {
    photo = 'photo',
    document = 'document',
    video = 'video',
    link = 'link',
}

export type BoostEvidenceSpec = {
    id?: string;
    type: [string, ...string[]]; // Changed from string[] to ensure at least one element
    name?: string;
    narrative?: string;
    description?: string;
    // evidenceDocument?: string; // Added this back - it's in the validator
    genre?: string;
    audience?: string;

    fileName?: string;
    fileType?: string;
    fileSize?: string;
};

export const boostMediaOptions = [
    {
        id: 1,
        type: BoostMediaOptionsEnum.photo,
        title: 'Photo',
        color: 'cyan-700',
        Icon: Camera,
    },
    {
        id: 2,
        type: BoostMediaOptionsEnum.document,
        title: 'Document',
        color: 'emerald-700',
        Icon: Document,
    },
    {
        id: 3,
        type: BoostMediaOptionsEnum.video,
        title: 'Video',
        color: 'rose-600',
        Icon: Video,
    },
    {
        id: 4,
        type: BoostMediaOptionsEnum.link,
        title: 'Link',
        color: 'indigo-600',
        Icon: LinkChain,
    },
];

export enum BoostCMSSkillsEnum {
    Creative = 'Creative',
    Emotional = 'Emotional',
    Social = 'Social',
    Cognitive = 'Cognitive',
    Physical = 'Physical',
}

export const boostCMSSkills = [
    BoostCMSSkillsEnum.Creative,
    BoostCMSSkillsEnum.Emotional,
    BoostCMSSkillsEnum.Social,
    BoostCMSSkillsEnum.Cognitive,
    BoostCMSSkillsEnum.Physical,
] as const;

export const SKILLS_TO_SUBSKILLS: {
    [key: BoostCMSSkillsEnum | string]: string[];
} = {
    [BoostCMSSkillsEnum.Creative]: [
        'Creative Process',
        'Generate Diverse Ideas',
        'Evaluate and Improve',
        'Generate Original Ideas',
        'Recognize and Transfer',
    ],
    [BoostCMSSkillsEnum.Emotional]: [
        'Emotional Subskill 1',
        'Emotional Subskill 2',
        'Emotional Subskill 3',
    ],
    [BoostCMSSkillsEnum.Social]: ['Social Subskill 1', 'Social Subskill 2', 'Social Subskill 3'],
    [BoostCMSSkillsEnum.Cognitive]: [
        'Cognitive Subskill 1',
        'Cognitive Subskill 2',
        'Cognitive Subskill 3',
    ],
    [BoostCMSSkillsEnum.Physical]: [
        'Physical Subskill 1',
        'Physical Subskill 2',
        'Physical Subskill 3',
    ],
};

export type MemberTitleTypes = {
    singular: string;
    plural: string;
};

export type BoostCMSBasicInfo = {
    name: string;
    description: string;
    narrative: string; // criteria narrative
    type: string; // main category
    achievementType: string | null; // sub category type
    credentialExpires: boolean;
    expirationDate?: string | null;

    memberTitles: {
        guardians: MemberTitleTypes;
        dependents: MemberTitleTypes;
    };

    // ID / Group fields
    location?: string;
    issuerName?: string;
};

export type BoostCMSIssueTo = {
    profileId: string;
    did: string;
    displayName?: string;
    email?: string;
    image?: string;
};

export type BoostCMSAdmin = {
    profileId: string;
    did: string;
    displayName?: string;
    email?: string;
    image?: string;
};

export type ShortBoostState = {
    issueTo: BoostCMSIssueTo[];
};

export type BoostCMSAppearance = {
    displayType: BoostCMSAppearanceDisplayTypeEnum | undefined;
    previewType: BoostCMSAppearancePreviewTypeEnum | undefined;

    // Troops 2.0 fields
    fadeBackgroundImage?: boolean;
    repeatBackgroundImage?: boolean;

    badgeThumbnail?: string;
    backgroundColor?: string;
    backgroundImage?: string;

    // ID / Group fields
    fontColor?: string;
    accentColor?: string;
    idBackgroundImage?: string;
    dimIdBackgroundImage?: boolean;
    idIssuerThumbnail?: string;
    showIdIssuerImage?: boolean;

    emoji?: EmojiClickData | null;
    toggleFamilyEmoji?: boolean;

    // Troops 2.0 fields
    idThumbnail?: string;
    accentFontColor?: string;
    idBackgroundColor?: string;
    repeatIdBackgroundImage: boolean;
    idDescription?: string;
};

export enum BoostCMSAppearanceDisplayTypeEnum {
    Badge = 'badge',
    Certificate = 'certificate',
    ID = 'id',
    Course = 'course',
    Family = 'family',
    Media = 'media',
}

export enum BoostCMSAppearancePreviewTypeEnum {
    Default = 'default', // defaults to display type
    Media = 'media',
}

export type BoostCMSSkill = {
    category: string;
    skill: string;
    subskills: string[];
};

export type BoostCMSMediaAttachment = {
    title: string | null;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    url: string | null; // upload URL
    type: BoostMediaOptionsEnum | string | null; // link, document, photo, video
};

export type BoostCMSState = {
    basicInfo: BoostCMSBasicInfo;
    issueTo: BoostCMSIssueTo[];
    admins: BoostCMSAdmin[];
    appearance: BoostCMSAppearance;
    skills: BoostCMSSkill[];
    mediaAttachments: BoostCMSMediaAttachment[]; // Modified to support multiple attachments of each type
    notes: string;
    address: AddressSpec;
    memberOptions: BoostCMSMemberOptions;
    alignments?: BoostCMSAlignment[];
};

export type BoostCMSAlignment = {
    type: 'Alignment';
    targetName: string; // e.g., Skill or Subskill name
    targetFramework?: string; // e.g., Category or Skill grouping
    targetUrl?: string;
    targetDescription?: string;
    targetCode?: string;
    targetType?: string;
};

export type BoostCMSMemberOptions = {
    publiclyDisplayMembers: boolean;
    autoConnectMembersInContacts: boolean;
};

export const initialBoostCMSState: BoostCMSState = {
    basicInfo: {
        name: '',
        description: '',
        narrative: '', // criteria narrative
        type: '', // main category
        achievementType: '', // sub category type
        credentialExpires: false,
        expirationDate: null,

        // ID / Group fields
        location: '',
        issuerName: '',
    },
    issueTo: [],
    admins: [],
    appearance: {
        displayType: undefined,

        badgeThumbnail: '',
        backgroundColor: '',
        backgroundImage: '',

        // ID / Group fields
        fontColor: '',
        accentColor: '',
        idBackgroundImage: '',
        dimIdBackgroundImage: false,
        idIssuerThumbnail: '',
        showIdIssuerImage: false,
    },
    skills: [],
    mediaAttachments: [], // Prepared to handle multiple attachments
    notes: '',
    address: {
        streetAddress: '',
        addressLocality: '',
        addressRegion: '',
        addressCountry: '',
        postalCode: '',
        geo: {
            latitude: undefined,
            longitude: undefined,
        },
    },
    memberOptions: {
        publiclyDisplayMembers: false,
        autoConnectMembersInContacts: false,
    },
};

export const getAttachmentFileInfo = (file: File) => {
    const match = file.name.match(/\.([0-9a-z]+)(?=[?#])?|(\.)(?:[\w]+)$/i);
    const extension = match?.[1]?.toLowerCase() ?? 'unknown';

    const type = extension.toUpperCase();
    const sizeInKB = (file.size / 1024).toFixed(1);
    const sizeString = `${sizeInKB} kB`;

    return {
        fileType: type,
        fileSize: sizeString,
        fileName: file.name,
    };
};

export const getMediaAttachments = (mediaAttachments: BoostCMSMediaAttachment[]) => {
    return mediaAttachments.filter(attachment => attachment.type === BoostMediaOptionsEnum.photo);
};

export const convertAttachmentsToEvidence = (
    attachments: BoostCMSMediaAttachment[] = []
): BoostEvidenceSpec[] => {
    return attachments
        .filter(att => att.url && att.type)
        .map(att => {
            const evidence: BoostEvidenceSpec = {
                id: att.url || undefined,
                type: ['Evidence', 'EvidenceFile'] as [string, ...string[]], // Ensure non-empty array
                name: att.title || att.fileName || undefined,
                genre: att.type || undefined,
                fileName: att.fileName || undefined,
                fileType: att.fileType || undefined,
                fileSize: att.fileSize || undefined,
            };

            return evidence;
        });
};
