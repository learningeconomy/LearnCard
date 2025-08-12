"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  getLerRsPlugin: () => getLerRsPlugin
});
module.exports = __toCommonJS(src_exports);

// src/ler-rs.ts
var VC_CONTEXT = "https://www.w3.org/ns/credentials/v2";
var LERRS_TYPE = "LERRS";
var toArray = /* @__PURE__ */ __name((maybe) => maybe == null ? [] : Array.isArray(maybe) ? maybe : [maybe], "toArray");
var buildEmploymentHistories = /* @__PURE__ */ __name((items) => {
  return items.map((item) => {
    const { narrative, verifiableCredential, position, employer, start, end, ...rest } = item;
    const container = { ...rest };
    if (employer)
      container.organization = { tradeName: employer };
    if (position || start || end) {
      const ph = {};
      if (position)
        ph.title = position;
      if (start)
        ph.start = start;
      if (end)
        ph.end = end;
      container.positionHistories = [ph];
    }
    if (narrative)
      container.narrative = narrative;
    const verifications = verifiableCredential ? [verifiableCredential] : [];
    return { ...container, ...verifications.length ? { verifications } : {} };
  });
}, "buildEmploymentHistories");
var buildEducationAndLearnings = /* @__PURE__ */ __name((items) => {
  return items.map((item) => {
    const { narrative, verifiableCredential, institution, start, end, degree, specializations, ...rest } = item;
    const container = { ...rest };
    if (institution)
      container.institution = institution;
    if (start)
      container.start = start;
    if (end)
      container.end = end;
    if (degree || specializations) {
      container.educationDegrees = [{ ...degree ? { name: degree } : {}, ...specializations ? { specializations } : {} }];
    }
    if (narrative)
      container.narrative = narrative;
    const verifications = verifiableCredential ? [verifiableCredential] : [];
    return { ...container, ...verifications.length ? { verifications } : {} };
  });
}, "buildEducationAndLearnings");
var buildCertifications = /* @__PURE__ */ __name((items) => {
  return items.map((item) => {
    const { narrative, verifiableCredential, ...rest } = item;
    const container = { ...rest };
    if (narrative)
      container.narrative = narrative;
    const verifications = verifiableCredential ? [verifiableCredential] : [];
    return { ...container, ...verifications.length ? { verifications } : {} };
  });
}, "buildCertifications");
var getLerRsPlugin = /* @__PURE__ */ __name((initLearnCard) => {
  return {
    name: "LER-RS",
    displayName: "LER-RS",
    description: "Create, package, and verify Learning & Employment Record Resume (LER-RS) credentials",
    methods: {
      createLerRecord: async (_learnCard, params) => {
        const signer = params.learnCard ?? _learnCard;
        const did = signer.id.did();
        const personSection = {
          id: params.person.id,
          name: {
            givenName: params.person.givenName,
            familyName: params.person.familyName,
            formattedName: `${params.person.givenName} ${params.person.familyName}`
          }
        };
        const communication = params.person.email ? { emails: [{ address: params.person.email }] } : void 0;
        const lerRecord = {
          person: personSection,
          ...communication ? { communication } : {},
          skills: (params.skills || []).map((s) => ({ name: s })),
          employmentHistories: params.workHistory ? buildEmploymentHistories(params.workHistory) : void 0,
          educationAndLearnings: params.educationHistory ? buildEducationAndLearnings(params.educationHistory) : void 0,
          certifications: params.certifications ? buildCertifications(params.certifications) : void 0,
          narratives: []
        };
        const unsignedVC = {
          "@context": [VC_CONTEXT],
          id: `urn:uuid:${crypto.randomUUID()}`,
          type: ["VerifiableCredential", LERRS_TYPE],
          issuer: did,
          validFrom: new Date().toISOString(),
          credentialSubject: {
            id: params.person.id,
            ler: lerRecord
          }
        };
        return initLearnCard.invoke.issueCredential(unsignedVC, { proofPurpose: "assertionMethod" });
      },
      createLerPresentation: async (_learnCard, params) => {
        const signer = params.learnCard ?? _learnCard;
        const did = signer.id.did();
        if (!params.credentials.length)
          throw new Error("createLerPresentation: credentials array must contain at least one credential");
        const containsLer = params.credentials.some((vc) => Array.isArray(vc.type) && vc.type.includes(LERRS_TYPE));
        if (!containsLer)
          throw new Error("createLerPresentation: credentials must include at least one LER-RS credential");
        const vp = {
          "@context": [VC_CONTEXT],
          type: ["VerifiablePresentation"],
          holder: did,
          verifiableCredential: params.credentials.length === 1 ? params.credentials[0] : params.credentials
        };
        return initLearnCard.invoke.issuePresentation(vp, {
          ...params.domain ? { domain: params.domain } : {},
          ...params.challenge ? { challenge: params.challenge } : {}
        });
      },
      verifyLerPresentation: async (_learnCard, { presentation, domain, challenge }) => {
        const presCheck = await initLearnCard.invoke.verifyPresentation(presentation, {
          ...domain ? { domain } : {},
          ...challenge ? { challenge } : {}
        });
        const presentationResult = {
          verified: presCheck.errors.length === 0,
          errors: presCheck.errors.length ? presCheck.errors : void 0
        };
        const credentialResults = [];
        if (typeof presentation !== "string") {
          const holder = presentation.holder;
          const vcs = toArray(presentation.verifiableCredential);
          for (const credential of vcs) {
            try {
              const credCheck = await initLearnCard.invoke.verifyCredential(credential);
              const issuerDid = typeof credential.issuer === "string" ? credential.issuer : credential.issuer?.id;
              const isSelfIssued = Array.isArray(credential.type) && credential.type.includes(LERRS_TYPE) || !!holder && !!issuerDid && issuerDid === holder;
              credentialResults.push({
                credential,
                verified: credCheck.errors.length === 0,
                isSelfIssued,
                errors: credCheck.errors.length ? credCheck.errors : void 0
              });
            } catch (err) {
              credentialResults.push({
                credential,
                verified: false,
                isSelfIssued: false,
                errors: [err instanceof Error ? err.message : "Unknown error verifying credential"]
              });
            }
          }
        }
        return {
          verified: presentationResult.verified && credentialResults.every((r) => r.verified || r.isSelfIssued),
          presentationResult,
          credentialResults
        };
      }
    }
  };
}, "getLerRsPlugin");
//# sourceMappingURL=ler-rs-plugin.cjs.development.js.map
