import Camera from 'learn-card-base/svgs/Camera';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import Video from 'learn-card-base/svgs/Video';
import Document from 'learn-card-base/svgs/Document';

import { BoostCategoryOptionsEnum } from './boost-options/boostOptions';
import { AddressSpec } from '../locationSearch/location.helpers';

export enum LCNBoostStatusEnum {
    draft = 'DRAFT',
    live = 'LIVE',
}

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

export type BoostCMSBasicInfo = {
    name: string;
    description: string;
    narrative: string; // criteria narrative
    type: BoostCategoryOptionsEnum | string; // main category
    achievementType: string | null; // sub category type
    credentialExpires: boolean;
    expirationDate?: string | null;

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
    unremovable?: boolean;
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
};

export type BoostCMSSkill = {
    category: string;
    skill: string;
    subskills: string[];
};

// Open Badge v3 Alignment type
export type BoostCMSAlignment = {
    type: 'Alignment';
    targetName: string; // e.g., Skill or Subskill name
    targetFramework?: string; // e.g., Category or Skill grouping
    targetUrl?: string;
    targetDescription?: string;
    targetCode?: string;
    targetType?: string;
    frameworkId?: string; // Neo4j framework ID for backend skill linking
};

export enum FrameworkNodeRole {
    competency = 'competency',
    tier = 'tier',
}

export type SkillFrameworkNode = BoostCMSAlignment & {
    id?: string;
    role: FrameworkNodeRole;
    icon?: string;
    subskills?: SkillFrameworkNode[];
};

export type SkillFrameworkNodeWithSearchInfo = SkillFrameworkNode & {
    path: SkillFrameworkNode[];
    numberOfSkills: number;
};

export type SkillFramework = {
    id: string;
    name: string;
    image?: string;
    description?: string;
    networks?: any[];
    admins?: any[];

    skills: SkillFrameworkNode[];
};

export type BoostCMSMediaAttachment = {
    title: string | null;
    url: string | null;
    type: BoostMediaOptionsEnum | string | null;
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
    alignments: [],
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

export const initialCustomBoostTypesState = {
    [BoostCategoryOptionsEnum.socialBadge]: [],
    [BoostCategoryOptionsEnum.achievement]: [],
    [BoostCategoryOptionsEnum.learningHistory]: [],
    [BoostCategoryOptionsEnum.id]: [],
    [BoostCategoryOptionsEnum.workHistory]: [],
    [BoostCategoryOptionsEnum.skill]: [],
    [BoostCategoryOptionsEnum.membership]: [],
    [BoostCategoryOptionsEnum.meritBadge]: [],
};
