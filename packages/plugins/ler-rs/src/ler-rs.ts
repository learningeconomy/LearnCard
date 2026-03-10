import { VC as VerifiableCredential, UnsignedVC, VP as VerifiablePresentation, UnsignedVP } from '@learncard/types';
import { LERRSDependentLearnCard, LERRSPlugin, CreateLerRecordParams, CreateLerPresentationParams, VerifyLerPresentationParams, VerificationResult, LerRsRecord } from './types';

const VC_CONTEXT = 'https://www.w3.org/ns/credentials/v2';
const LERRS_TYPE = 'LERRS';

const toArray = <T>(maybe: T | T[] | undefined): T[] => (maybe == null ? [] : Array.isArray(maybe) ? maybe : [maybe]);

const buildEmploymentHistories = (items: NonNullable<CreateLerRecordParams['workHistory']>): LerRsRecord['employmentHistories'] => {
  return items.map(item => {
    const { narrative, verifiableCredential, position, employer, start, end, ...rest } = item;

    const container: Record<string, unknown> = { ...rest };

    if (employer) container.organization = { tradeName: employer };
    if (position || start || end) {
      const ph: Record<string, unknown> = {};
      if (position) ph.title = position;
      if (start) ph.start = start;
      if (end) ph.end = end;
      container.positionHistories = [ph];
    }
    if (narrative) container.narrative = narrative;

    const verifications = verifiableCredential ? [verifiableCredential] : [];
    return { ...container, ...(verifications.length ? { verifications } : {}) };
  });
};

const buildEducationAndLearnings = (items: NonNullable<CreateLerRecordParams['educationHistory']>): LerRsRecord['educationAndLearnings'] => {
  return items.map(item => {
    const { narrative, verifiableCredential, institution, start, end, degree, specializations, ...rest } = item;

    const container: Record<string, unknown> = { ...rest };
    if (institution) container.institution = institution;
    if (start) container.start = start;
    if (end) container.end = end;
    if (degree || specializations) {
      container.educationDegrees = [{ ...(degree ? { name: degree } : {}), ...(specializations ? { specializations } : {}) }];
    }
    if (narrative) container.narrative = narrative;

    const verifications = verifiableCredential ? [verifiableCredential] : [];
    return { ...container, ...(verifications.length ? { verifications } : {}) };
  });
};

const buildCertifications = (items: NonNullable<CreateLerRecordParams['certifications']>): LerRsRecord['certifications'] => {
  return items.map(item => {
    const { narrative, verifiableCredential, ...rest } = item;

    const container: Record<string, unknown> = { ...rest };
    if (narrative) container.narrative = narrative;

    const verifications = verifiableCredential ? [verifiableCredential] : [];
    return { ...container, ...(verifications.length ? { verifications } : {}) };
  });
};

export const getLerRsPlugin = (initLearnCard: LERRSDependentLearnCard): LERRSPlugin => {
  return {
    name: 'LER-RS',
    displayName: 'LER-RS',
    description: 'Create, package, and verify Learning & Employment Record Resume (LER-RS) credentials',
    methods: {
      createLerRecord: async (_learnCard, params): Promise<VerifiableCredential> => {
        const signer = params.learnCard ?? _learnCard;
        const did = signer.id.did();

        const personSection: LerRsRecord['person'] = {
          id: params.person.id,
          name: {
            givenName: params.person.givenName,
            familyName: params.person.familyName,
            formattedName: `${params.person.givenName} ${params.person.familyName}`,
          },
        };

        const communication: LerRsRecord['communication'] | undefined = params.person.email
          ? { emails: [{ address: params.person.email }] }
          : undefined;

        const lerRecord: LerRsRecord = {
          person: personSection,
          ...(communication ? { communication } : {}),
          skills: (params.skills || []).map(s => ({ name: s })),
          employmentHistories: params.workHistory ? buildEmploymentHistories(params.workHistory) : undefined,
          educationAndLearnings: params.educationHistory ? buildEducationAndLearnings(params.educationHistory) : undefined,
          certifications: params.certifications ? buildCertifications(params.certifications) : undefined,
          narratives: [],
        };

        const unsignedVC: UnsignedVC = {
          '@context': [VC_CONTEXT],
          id: `urn:uuid:${crypto.randomUUID()}`,
          type: ['VerifiableCredential', LERRS_TYPE],
          issuer: did,
          validFrom: new Date().toISOString(),
          credentialSubject: {
            id: params.person.id,
            ler: lerRecord,
          },
        };

        return initLearnCard.invoke.issueCredential(unsignedVC, { proofPurpose: 'assertionMethod' });
      },

      createLerPresentation: async (_learnCard, params): Promise<VerifiablePresentation> => {
        const signer = params.learnCard ?? _learnCard;
        const did = signer.id.did();

        if (!params.credentials.length) throw new Error('createLerPresentation: credentials array must contain at least one credential');
        const containsLer = params.credentials.some(vc => Array.isArray(vc.type) && vc.type.includes(LERRS_TYPE));
        if (!containsLer) throw new Error('createLerPresentation: credentials must include at least one LER-RS credential');

        const vp: UnsignedVP = {
          '@context': [VC_CONTEXT],
          type: ['VerifiablePresentation'],
          holder: did,
          verifiableCredential: params.credentials.length === 1 ? params.credentials[0] : params.credentials,
        };

        return initLearnCard.invoke.issuePresentation(vp, {
          ...(params.domain ? { domain: params.domain } : {}),
          ...(params.challenge ? { challenge: params.challenge } : {}),
        });
      },

      verifyLerPresentation: async (_learnCard, { presentation, domain, challenge }: VerifyLerPresentationParams): Promise<VerificationResult> => {
        const presCheck = await initLearnCard.invoke.verifyPresentation(presentation, {
          ...(domain ? { domain } : {}),
          ...(challenge ? { challenge } : {}),
        });

        const presentationResult = {
          verified: presCheck.errors.length === 0,
          errors: presCheck.errors.length ? presCheck.errors : undefined,
        };

        const credentialResults: VerificationResult['credentialResults'] = [];

        if (typeof presentation !== 'string') {
          const holder = presentation.holder;
          const vcs = toArray<VerifiableCredential>(presentation.verifiableCredential as any);

          for (const credential of vcs) {
            try {
              const credCheck = await initLearnCard.invoke.verifyCredential(credential);
              const issuerDid = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.id;
              const isSelfIssued = (Array.isArray(credential.type) && credential.type.includes(LERRS_TYPE)) || (!!holder && !!issuerDid && issuerDid === holder);

              credentialResults.push({
                credential,
                verified: credCheck.errors.length === 0,
                isSelfIssued,
                errors: credCheck.errors.length ? credCheck.errors : undefined,
              });
            } catch (err) {
              credentialResults.push({
                credential,
                verified: false,
                isSelfIssued: false,
                errors: [err instanceof Error ? err.message : 'Unknown error verifying credential'],
              });
            }
          }
        }

        return {
          verified: presentationResult.verified && credentialResults.every(r => r.verified || r.isSelfIssued),
          presentationResult,
          credentialResults,
        };
      },
    },
  };
};
