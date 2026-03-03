import { VC } from '@learncard/types';
import { ID_CARD_DISPLAY_INPUTS, ID_CARD_DISPLAY_TYPES } from '.';
import { getCredentialName, getCredentialSubject, getIssuer } from '../../credentialHelpers';

type ContextMappingFunction = (vc: VC) => ID_CARD_DISPLAY_INPUTS | undefined;

export const getMappedInputs = (vc: VC): ContextMappingFunction => {
    const types = Array.isArray(vc?.type) ? vc?.type : [vc?.type];
    // Search backwards through types, assuming last type is most specific i.e. ['VerifiableCredential', 'BoostCredential', 'BoostId'] where BoostId is most specific.
    let typeMapping: ContextMappingFunction | undefined;

    for (let x = 0; x < types.length; x++) {
        if (typeMappings?.[types[x]]) {
            typeMapping = typeMappings?.[types[x]];
        }
    }

    return typeMapping || (() => undefined);
};

export const typeMappings: Record<string, ContextMappingFunction> = {
    BoostId: (vc: VC): ID_CARD_DISPLAY_INPUTS | undefined => {
        return {
            idDisplayType: ID_CARD_DISPLAY_TYPES.BoostId,

            name: getCredentialName(vc),
            location: vc?.address?.streetAddress,

            backgroundImage: vc?.boostID?.backgroundImage,
            dimBackgroundImage: vc?.boostID?.dimBackgroundImage,

            fontColor: vc?.boostID?.fontColor,
            accentColor: vc?.boostID?.accentColor,

            showIssuerName: true,
            idIssuerName: vc?.boostID?.IDIssuerName,

            showIssuerImage: vc?.boostID?.showIssuerThumbnail,
            issuerThumbnail: vc?.boostID?.issuerThumbnail,

            idClassName: 'p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]',
            idFooterClassName: 'p-0 m-0 mt-[-15px] boost-id-preview-footer',
            customIssuerThumbContainerClass: 'id-card-issuer-thumb-preview-container',
        };
    },
    AlumniCredential: (vc: VC): ID_CARD_DISPLAY_INPUTS | undefined => {
        return {};
    },
    PermanentResidentCard: (vc: VC): ID_CARD_DISPLAY_INPUTS | undefined => {
        const credentialSubject = getCredentialSubject(vc);
        const issueeName = `${credentialSubject?.givenName} ${credentialSubject?.familyName}`;
        const issuer = getIssuer(vc);

        const re = {
            idDisplayType: ID_CARD_DISPLAY_TYPES.PermanentResidentCard,
            credentialSubject,

            name: getCredentialName(vc),
            location: credentialSubject?.birthCountry,

            issueeName,
            issueeThumbnail: credentialSubject?.image,

            //backgroundImage: vc?.boostID?.backgroundImage,
            //dimBackgroundImage: vc?.boostID?.dimBackgroundImage,

            //fontColor: vc?.boostID?.fontColor,
            //accentColor: vc?.boostID?.accentColor,
            fontColor: '#ffffff',
            accentColor: '#4F46E5',

            showIssuerName: !!vc?.description,
            idIssuerName: vc?.description,

            showIssuerImage: !!issuer?.image,
            issuerThumbnail: issuer?.image,

            idClassName: 'p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]',
            idFooterClassName: 'p-0 m-0 mt-[-15px] boost-id-preview-footer',
            customIssuerThumbContainerClass: 'id-card-issuer-thumb-preview-container',
        };
        return re;
    },
};
