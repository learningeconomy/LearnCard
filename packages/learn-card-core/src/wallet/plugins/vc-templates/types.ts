import { UnsignedVC, VC, UnsignedVP } from '@learncard/types';
import { DiscriminatedUnionize } from 'types/helpers';

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
    fullAchievement: {
        did?: string;
        subject?: string;
        name?: string;
        achievementName?: string;
        description?: string;
        issuanceDate?: string;
        expirationDate?: string;
    };
};

/** @group VC Templates Plugin */
export type NewCredentialFunction = (args?: DiscriminatedUnionize<VcTemplates>) => UnsignedVC;

/** @group VC Templates Plugin */
export type VCTemplatePluginDependentMethods = { getSubjectDid?: (type: 'key') => string } | {};

/** @group VC Templates Plugin */
export type VCTemplatePluginMethods = {
    getSubjectDid?: (type: 'key') => string;
    newCredential: NewCredentialFunction;
    newPresentation: (credential: VC, args?: { did?: string }) => Promise<UnsignedVP>;
};
