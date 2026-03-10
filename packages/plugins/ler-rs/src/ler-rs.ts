import { VC as VerifiableCredential, UnsignedVC, VP as VerifiablePresentation, UnsignedVP } from '@learncard/types';
import {
  LERRSDependentLearnCard,
  LERRSPlugin,
  CreateLerRecordParams,
  CreateLerPresentationParams,
  VerifyLerPresentationParams,
  VerificationResult,
  LerRsRecord,
  LER_RS_CREDENTIAL_CONTEXT_V1,
  LER_RS_VC_CONTEXT_V45,
  LER_RS_TYPE_URI_V45,
  LEGACY_LER_RS_TYPE_URI_V44,
  LEGACY_LER_RS_TYPE_TOKEN,
} from './types';

const getItemVerifications = (item: { verifiableCredential?: VerifiableCredential; verifications?: VerifiableCredential[] }): VerifiableCredential[] => {
  if (item.verifications?.length) return item.verifications;
  if (item.verifiableCredential) return [item.verifiableCredential];
  return [];
};

const toArray = <T>(maybe: T | T[] | undefined): T[] => (maybe == null ? [] : Array.isArray(maybe) ? maybe : [maybe]);

const credentialHasLerRsType = (credential: VerifiableCredential): boolean => {
  const typeList = Array.isArray(credential.type) ? credential.type : [credential.type];
  if (typeList.some(type => [LEGACY_LER_RS_TYPE_TOKEN, LEGACY_LER_RS_TYPE_URI_V44, LER_RS_TYPE_URI_V45].includes(type))) return true;

  const credentialSubject = credential.credentialSubject as Record<string, unknown> | undefined;
  if (!credentialSubject) return false;

  const inlineType = credentialSubject.type;
  if (typeof inlineType === 'string' && [LEGACY_LER_RS_TYPE_URI_V44, LER_RS_TYPE_URI_V45].includes(inlineType)) return true;

  const nestedType = (credentialSubject.lerrsType as Record<string, unknown> | undefined)?.type;
  return typeof nestedType === 'string' && [LEGACY_LER_RS_TYPE_URI_V44, LER_RS_TYPE_URI_V45].includes(nestedType);
};

const buildEmploymentHistories = (items: NonNullable<CreateLerRecordParams['workHistory']>): LerRsRecord['employmentHistories'] => {
  return items.map(item => {
    const { narrative, verifiableCredential, verifications, position, employer, start, end, ...rest } = item;

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

    const containerVerifications = getItemVerifications({ verifiableCredential, verifications });
    return { ...container, ...(containerVerifications.length ? { verifications: containerVerifications } : {}) };
  });
};

const buildEducationAndLearnings = (items: NonNullable<CreateLerRecordParams['educationHistory']>): LerRsRecord['educationAndLearnings'] => {
  return items.map(item => {
    const { narrative, verifiableCredential, verifications, institution, start, end, degree, specializations, ...rest } = item;

    const container: Record<string, unknown> = { ...rest };
    if (institution) container.institution = { name: institution };
    if (start) container.start = start;
    if (end) container.end = end;
    if (degree || specializations) {
      container.educationDegrees = [
        {
          ...(degree ? { name: degree } : {}),
          ...(specializations
            ? { specializations: specializations.map(specialization => ({ name: specialization })) }
            : {}),
        },
      ];
    }
    if (narrative) container.narrative = narrative;

    const containerVerifications = getItemVerifications({ verifiableCredential, verifications });
    return { ...container, ...(containerVerifications.length ? { verifications: containerVerifications } : {}) };
  });
};

const buildCertifications = (items: NonNullable<CreateLerRecordParams['certifications']>): LerRsRecord['certifications'] => {
  return items.map(item => {
    const { narrative, verifiableCredential, verifications, ...rest } = item;

    const container: Record<string, unknown> = { ...rest };
    if (narrative) container.narrative = narrative;

    const containerVerifications = getItemVerifications({ verifiableCredential, verifications });
    return { ...container, ...(containerVerifications.length ? { verifications: containerVerifications } : {}) };
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
        const issuedAt = new Date().toISOString();
        const documentId = crypto.randomUUID();

        const personSection: LerRsRecord['person'] = {
          name: {
            given: params.person.givenName,
            family: params.person.familyName,
            formattedName: params.person.formattedName ?? `${params.person.givenName} ${params.person.familyName}`,
          },
        };

        const communication: LerRsRecord['communication'] | undefined = params.person.email
          ? { email: [{ address: params.person.email }] }
          : undefined;

        const lerRecord: LerRsRecord = {
          type: LER_RS_TYPE_URI_V45,
          documentId: { value: documentId },
          person: personSection,
          ...(communication ? { communication } : {}),
          skills: (params.skills || []).map(s => ({ name: s })),
          employmentHistories: params.workHistory ? buildEmploymentHistories(params.workHistory) : undefined,
          educationAndLearnings: params.educationHistory ? buildEducationAndLearnings(params.educationHistory) : undefined,
          certifications: params.certifications ? buildCertifications(params.certifications) : undefined,
        };

        const unsignedVC: UnsignedVC = {
          '@context': [LER_RS_CREDENTIAL_CONTEXT_V1, LER_RS_VC_CONTEXT_V45],
          id: `urn:uuid:${documentId}`,
          type: ['VerifiableCredential', LER_RS_TYPE_URI_V45],
          issuer: did,
          issuanceDate: issuedAt,
          credentialSubject: {
            id: params.person.id,
            ...lerRecord,
          },
        };

        return initLearnCard.invoke.issueCredential(unsignedVC, { proofPurpose: 'assertionMethod' });
      },

      createLerPresentation: async (_learnCard, params): Promise<VerifiablePresentation> => {
        const signer = params.learnCard ?? _learnCard;
        const did = signer.id.did();

        if (!params.credentials.length) throw new Error('createLerPresentation: credentials array must contain at least one credential');
        const containsLer = params.credentials.some(credentialHasLerRsType);
        if (!containsLer) throw new Error('createLerPresentation: credentials must include at least one LER-RS credential');

        const vp: UnsignedVP = {
          '@context': [LER_RS_CREDENTIAL_CONTEXT_V1],
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
              const isSelfIssued = credentialHasLerRsType(credential) || (!!holder && !!issuerDid && issuerDid === holder);

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
