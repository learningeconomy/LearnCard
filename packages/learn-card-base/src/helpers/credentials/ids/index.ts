import {
    VC,
    KnownAchievementType,
    AchievementCredentialValidator,
    UnsignedAchievementCredentialValidator,
    Image,
} from '@learncard/types';
import { getCredentialName } from '../../credentialHelpers';
import { getMappedInputs } from './mappings';

export enum ID_CARD_DISPLAY_TYPES {
    BoostId = 'BoostId',
    AlumniCredential = 'AlumniCredential',
    PermanentResidentCard = 'PermanentResidentCard',
}

export type ID_CARD_DISPLAY_INPUTS = {
    // custom fields / non boost fields
    idDisplayType?: ID_CARD_DISPLAY_TYPES;

    name?: string;
    location?: string;

    issueeName?: string;
    issueeThumbnail?: string;

    credentialSubject?: any;

    // BoostID / boost fields
    backgroundImage?: string;
    dimBackgroundImage?: boolean;

    fontColor?: string;
    accentColor?: string;

    showIssuerName?: boolean;
    idIssuerName?: string;

    showIssuerImage?: boolean;
    issuerThumbnail?: string;

    idClassName?: string;
    idFooterClassName?: string;
    customIssuerThumbContainerClass?: string;
};

export const getIDCardDisplayInputsFromVC = (vc: VC): ID_CARD_DISPLAY_INPUTS => {
    const inputs = {
        ...getDefaultIDCardDisplayInputs(),
        ...getMappedInputs(vc)(vc),
    };
    return inputs;
};

export const getDefaultIDCardDisplayInputs = (): ID_CARD_DISPLAY_INPUTS => {
    return {
        idClassName: 'p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]',
        idFooterClassName: 'p-0 m-0 mt-[-15px] boost-id-preview-footer',
        customIssuerThumbContainerClass: 'id-card-issuer-thumb-preview-container',
    };
};

/** helper to get a unique id because the id field is always http://example.com/credentials/3527 right now */
export const getUniqueId = (credential: VC, moreUniqueness: any = '') => {
    // this is causing the all selected ids array to be undefined-undefined-undefined-undefined for me when creating a boost bundle....
    // i think maybe a diff approuch could be a deterministically generated uuid with a seed maybe
    //   - we'll compromise 😜
    if (credential.id && credential.id !== 'http://example.com/credentials/3527') {
        return `${credential.id}`;
    } else {
        return `${credential.id}-${credential.proof?.proofValue}-${credential.issuanceDate}${moreUniqueness ? `-${moreUniqueness}` : ''
            }`;
    }
};
