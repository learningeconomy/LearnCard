import { UnsignedVC, VC, UnsignedVP } from '@learncard/types';
import { DiscriminatedUnionize } from './type.helpers';
import { Plugin } from '@learncard/core';

/** @group VC Templates Plugin */
export type BoostAttachment = {
    type?: string;
    title?: string;
    url?: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
};

export type BoostSkills = {
    category: string;
    skill: string;
    subskills: string[];
};

export type DisplayType = 'badge' | 'certificate' | 'id' | 'course' | 'award' | 'media';
export type PreviewType = 'default' | 'media';

/** @group VC Templates Plugin */
export type BoostDisplay = {
    backgroundImage?: string;
    backgroundColor?: string;

    fadeBackgroundImage?: boolean;
    repeatBackgroundImage?: boolean;

    emoji: BoostEmoji;

    displayType?: DisplayType;
    previewType?: PreviewType;
};

export type BoostFamilyTitleOption = {
    plural: string;
    singular: string;
};

export type BoostFamilyTitles = {
    guardians: BoostFamilyTitleOption[];
    dependents: BoostFamilyTitleOption[];
};

export type BoostEmoji = {
    activeSkinTone: string;
    unified: string;
    unifiedWithoutSkinTone: string;
    names: string[];
    imageUrl: string;
};

export type BoostID = {
    fontColor?: string;
    accentColor?: string;
    backgroundImage?: string;
    dimBackgroundImage?: boolean;
    issuerThumbnail?: string;
    showIssuerThumbnail?: boolean;
    IDIssuerName?: string;

    idThumbnail?: string;
    accentFontColor?: string;
    idBackgroundColor?: string;
    repeatIdBackgroundImage: boolean;
    idDescription?: string;
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

export type Source = {
    type: string[];
    id?: string;
    name?: string;
    description?: string;
    url?: string;
    image?: string;
    address?: {
        type?: string[];
        addressLocality?: string;
        addressRegion?: string;
        addressCountry?: string;
    };
};

export type Alignment = {
    type: string[];
    targetName?: string; // https://purl.imsglobal.org/spec/vc/ob/vocab.html#targetName
    targetType?: string; // https://purl.imsglobal.org/spec/vc/ob/vocab.html#targetType
    targetFramework?: string; // https://purl.imsglobal.org/spec/vc/ob/vocab.html#targetFramework
};

export interface Evidence {
    id?: string;
    type: [string, ...string[]]; // Changed from string[] to ensure at least one element
    name?: string;
    narrative?: string;
    description?: string;
    genre?: string;
    audience?: string;

    // Extended fields
    fileName?: string;
    fileType?: string;
    fileSize?: string;
}

export type BoostTemplate = {
    did?: string;
    subject?: string;
    issuanceDate?: string;
    expirationDate?: string;
    boostId?: string;
    boostName?: string;
    boostImage?: string;
    achievementId?: string;
    achievementType?: string;
    achievementName?: string;
    achievementDescription?: string;
    achievementNarrative?: string;
    achievementImage?: string;
    attachments?: BoostAttachment[];
    skills?: BoostSkills[];
    display?: BoostDisplay;
    familyTitles?: BoostFamilyTitles;
    boostID?: BoostID;
    address?: AddressSpec;
    groupID?: string;
    evidence?: Evidence[];
    alignment?: Alignment[];
    source?: Source;
};

/** @group VC Templates Plugin */
export type VcTemplates = {
    basic: { did?: string; subject?: string; issuanceDate?: string };
    achievement: {
        did?: string;
        subject?: string;
        name?: string;
        achievementName?: string;
        description?: string;
        criteriaNarrative?: string;
        issuanceDate?: string;
    };
    jff2: { did?: string; subject?: string; issuanceDate?: string };
    boost: BoostTemplate;
    boostID: BoostTemplate;
    delegate: {
        did?: string;
        subject?: string;
        issuanceDate?: string;
        access?: ('read' | 'write')[];
    };
};

/** @group VC Templates Plugin */
export type NewCredentialFunction = (args?: DiscriminatedUnionize<VcTemplates>) => UnsignedVC;

/** @group VC Templates Plugin */
export type VCTemplatePluginDependentMethods = {
    getSubjectDid?: (type: 'key') => string;
    crypto: () => Crypto;
};

/** @group VC Templates Plugin */
export type VCTemplatePluginMethods = {
    newCredential: NewCredentialFunction;
    newPresentation: (credential: VC, args?: { did?: string }) => Promise<UnsignedVP>;
};

/** @group VC Templates Plugin */
export type VCTemplatePlugin = Plugin<
    'VC Templates',
    any,
    VCTemplatePluginMethods,
    'id',
    VCTemplatePluginDependentMethods
>;
