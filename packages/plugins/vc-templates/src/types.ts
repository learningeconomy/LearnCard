import { UnsignedVC, VC, UnsignedVP } from '@learncard/types';
import { DiscriminatedUnionize } from './type.helpers';
import { Plugin } from '@learncard/core';

/** @group VC Templates Plugin */
export type BoostAttachment = {
    type?: string;
    title?: string;
    url?: string;
};

/** @group VC Templates Plugin */
export type BoostDisplay = {
    backgroundImage?: string;
    backgroundColor?: string;
};

export type BoostID = {
    fontColor?: string;
    accentColor?: string;
    backgroundImage?: string;
    dimBackgroundImage?: boolean;
    issuerThumbnail?: string;
    showIssuerThumbnail?: boolean;
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
    display?: BoostDisplay;
    boostID?: BoostID;
    address?: AddressSpec;
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
};

/** @group VC Templates Plugin */
export type NewCredentialFunction = (args?: DiscriminatedUnionize<VcTemplates>) => UnsignedVC;

/** @group VC Templates Plugin */
export type VCTemplatePluginDependentMethods = { getSubjectDid?: (type: 'key') => string };

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
