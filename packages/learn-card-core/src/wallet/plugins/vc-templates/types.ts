import { UnsignedVC, VC, UnsignedVP } from '@learncard/types';
import { DiscriminatedUnionize } from 'types/helpers';
import { Plugin } from 'types/wallet';

/** @group VC Templates Plugin */
export type BoostAttachment = {
    type?: string;
    title?: string;
    url?: string;
}

/** @group VC Templates Plugin */
export type BoostDisplay = {
    backgroundImage?: string;
    backgroundColor?: string;
}

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
    boost: { 
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
    };
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
