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
var index_exports = {};
__export(index_exports, {
  ALL_FIXTURES: () => ALL_FIXTURES,
  CREDENTIAL_FEATURES: () => CREDENTIAL_FEATURES,
  CREDENTIAL_PROFILES: () => CREDENTIAL_PROFILES,
  CREDENTIAL_SPECS: () => CREDENTIAL_SPECS,
  FIXTURE_SOURCES: () => FIXTURE_SOURCES,
  FIXTURE_VALIDITIES: () => FIXTURE_VALIDITIES,
  boostBasic: () => boostBasic,
  boostId: () => boostId,
  boostWithSkills: () => boostWithSkills,
  clrMinimal: () => clrMinimal,
  clrMultiAchievement: () => clrMultiAchievement,
  findFixture: () => findFixture,
  getAllFixtures: () => getAllFixtures,
  getFixture: () => getFixture,
  getFixtures: () => getFixtures,
  getInvalidFixtures: () => getInvalidFixtures,
  getSignedFixtures: () => getSignedFixtures,
  getStats: () => getStats,
  getUnsignedFixtures: () => getUnsignedFixtures,
  getValidFixtures: () => getValidFixtures,
  invalidEmptyType: () => invalidEmptyType,
  invalidMissingContext: () => invalidMissingContext,
  invalidMissingIssuer: () => invalidMissingIssuer,
  obv3FullBadge: () => obv3FullBadge,
  obv3MinimalBadge: () => obv3MinimalBadge,
  obv3PlugfestJff2: () => obv3PlugfestJff2,
  obv3WithAlignment: () => obv3WithAlignment,
  obv3WithEndorsement: () => obv3WithEndorsement,
  prepareFixture: () => prepareFixture,
  prepareFixtureById: () => prepareFixtureById,
  registerFixture: () => registerFixture,
  registerFixtures: () => registerFixtures,
  resetRegistry: () => resetRegistry,
  vcV1Basic: () => vcV1Basic,
  vcV1WithStatus: () => vcV1WithStatus,
  vcV2Basic: () => vcV2Basic,
  vcV2MultipleSubjects: () => vcV2MultipleSubjects,
  vcV2WithEvidence: () => vcV2WithEvidence
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var CREDENTIAL_SPECS = [
  "vc-v1",
  "vc-v2",
  "obv3",
  "clr-v2",
  "europass",
  "custom"
];
var CREDENTIAL_PROFILES = [
  "badge",
  "diploma",
  "certificate",
  "id",
  "membership",
  "license",
  "micro-credential",
  "course",
  "degree",
  "boost",
  "boost-id",
  "delegate",
  "endorsement",
  "learner-record",
  "generic"
];
var CREDENTIAL_FEATURES = [
  "evidence",
  "alignment",
  "endorsement",
  "expiration",
  "status",
  "multiple-subjects",
  "multiple-proofs",
  "refresh-service",
  "terms-of-use",
  "credential-schema",
  "image",
  "results",
  "source",
  "skills",
  "display",
  "attachments",
  "associations",
  "nested-credentials"
];
var FIXTURE_SOURCES = [
  "spec-example",
  "plugfest",
  "real-world",
  "synthetic"
];
var FIXTURE_VALIDITIES = ["valid", "invalid", "tampered"];

// src/registry.ts
var fixtures = [];
var fixtureIndex = /* @__PURE__ */ new Map();
var registerFixture = /* @__PURE__ */ __name((fixture) => {
  if (fixtureIndex.has(fixture.id)) {
    throw new Error(`Duplicate fixture ID: "${fixture.id}". Each fixture must have a unique id.`);
  }
  fixtures.push(fixture);
  fixtureIndex.set(fixture.id, fixture);
}, "registerFixture");
var registerFixtures = /* @__PURE__ */ __name((batch) => {
  for (const fixture of batch) {
    registerFixture(fixture);
  }
}, "registerFixtures");
var resetRegistry = /* @__PURE__ */ __name(() => {
  fixtures.length = 0;
  fixtureIndex.clear();
}, "resetRegistry");
var toArray = /* @__PURE__ */ __name((value) => Array.isArray(value) ? value : [value], "toArray");
var matchesFilter = /* @__PURE__ */ __name((fixture, filter) => {
  if (filter.spec !== void 0) {
    const specs = toArray(filter.spec);
    if (!specs.includes(fixture.spec)) return false;
  }
  if (filter.profile !== void 0) {
    const profiles = toArray(filter.profile);
    if (!profiles.includes(fixture.profile)) return false;
  }
  if (filter.features !== void 0) {
    for (const feat of filter.features) {
      if (!fixture.features.includes(feat)) return false;
    }
  }
  if (filter.featuresAny !== void 0) {
    const hasAny = filter.featuresAny.some((feat) => fixture.features.includes(feat));
    if (!hasAny) return false;
  }
  if (filter.signed !== void 0) {
    if (fixture.signed !== filter.signed) return false;
  }
  if (filter.validity !== void 0) {
    const validities = toArray(filter.validity);
    if (!validities.includes(fixture.validity)) return false;
  }
  if (filter.source !== void 0) {
    const sources = toArray(filter.source);
    if (!sources.includes(fixture.source)) return false;
  }
  if (filter.tags !== void 0) {
    for (const tag of filter.tags) {
      if (!fixture.tags?.includes(tag)) return false;
    }
  }
  return true;
}, "matchesFilter");
var getAllFixtures = /* @__PURE__ */ __name(() => fixtures, "getAllFixtures");
var getFixture = /* @__PURE__ */ __name((id) => {
  const fixture = fixtureIndex.get(id);
  if (!fixture) {
    throw new Error(
      `Fixture "${id}" not found. Available: ${[...fixtureIndex.keys()].join(", ")}`
    );
  }
  return fixture;
}, "getFixture");
var findFixture = /* @__PURE__ */ __name((id) => fixtureIndex.get(id), "findFixture");
var getFixtures = /* @__PURE__ */ __name((filter) => fixtures.filter((f) => matchesFilter(f, filter)), "getFixtures");
var getUnsignedFixtures = /* @__PURE__ */ __name((filter) => getFixtures({ ...filter, signed: false }), "getUnsignedFixtures");
var getSignedFixtures = /* @__PURE__ */ __name((filter) => getFixtures({ ...filter, signed: true }), "getSignedFixtures");
var getValidFixtures = /* @__PURE__ */ __name((filter) => getFixtures({ ...filter, validity: "valid" }), "getValidFixtures");
var getInvalidFixtures = /* @__PURE__ */ __name((filter) => getFixtures({ ...filter, validity: ["invalid", "tampered"] }), "getInvalidFixtures");
var getStats = /* @__PURE__ */ __name(() => {
  const stats = {
    total: fixtures.length,
    bySpec: {},
    byProfile: {},
    byValidity: {},
    signed: 0,
    unsigned: 0
  };
  for (const f of fixtures) {
    stats.bySpec[f.spec] = (stats.bySpec[f.spec] ?? 0) + 1;
    stats.byProfile[f.profile] = (stats.byProfile[f.profile] ?? 0) + 1;
    stats.byValidity[f.validity] = (stats.byValidity[f.validity] ?? 0) + 1;
    if (f.signed) {
      stats.signed++;
    } else {
      stats.unsigned++;
    }
  }
  return stats;
}, "getStats");

// src/prepare.ts
var generateUuid = /* @__PURE__ */ __name(() => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}, "generateUuid");
var patchIds = /* @__PURE__ */ __name((obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "id" && typeof value === "string" && value.startsWith("urn:uuid:")) {
      result[key] = `urn:uuid:${generateUuid()}`;
    } else if (Array.isArray(value)) {
      result[key] = value.map(
        (item) => item && typeof item === "object" && !Array.isArray(item) ? patchIds(item) : item
      );
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = patchIds(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}, "patchIds");
var patchIssuer = /* @__PURE__ */ __name((issuer, issuerDid) => {
  if (typeof issuer === "string") {
    return issuerDid;
  }
  if (issuer && typeof issuer === "object") {
    return { ...issuer, id: issuerDid };
  }
  return issuerDid;
}, "patchIssuer");
var patchSubject = /* @__PURE__ */ __name((subject, subjectDid) => {
  if (Array.isArray(subject)) {
    return subject.map((s) => patchSubject(s, subjectDid));
  }
  if (subject && typeof subject === "object") {
    return { ...subject, id: subjectDid };
  }
  return subject;
}, "patchSubject");
var prepareFixture = /* @__PURE__ */ __name((fixture, options) => {
  const { issuerDid, subjectDid, validFrom, validUntil, freshIds = true } = options;
  let credential = JSON.parse(JSON.stringify(fixture.credential));
  if (freshIds) {
    credential = patchIds(credential);
  }
  credential.issuer = patchIssuer(credential.issuer, issuerDid);
  if (subjectDid && credential.credentialSubject) {
    credential.credentialSubject = patchSubject(credential.credentialSubject, subjectDid);
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (credential.validFrom !== void 0 || credential.issuanceDate !== void 0) {
    if (credential.validFrom !== void 0) {
      credential.validFrom = validFrom ?? now;
    }
    if (credential.issuanceDate !== void 0) {
      credential.issuanceDate = validFrom ?? now;
    }
  } else {
    credential.validFrom = validFrom ?? now;
  }
  if (validUntil !== void 0) {
    if (credential.validUntil !== void 0) {
      credential.validUntil = validUntil;
    } else if (credential.expirationDate !== void 0) {
      credential.expirationDate = validUntil;
    } else {
      credential.validUntil = validUntil;
    }
  }
  return credential;
}, "prepareFixture");
var prepareFixtureById = /* @__PURE__ */ __name((fixtureId, options) => prepareFixture(getFixture(fixtureId), options), "prepareFixtureById");

// src/fixtures/vc-v1/basic.ts
var import_types = require("@learncard/types");
var vcV1Basic = {
  id: "vc-v1/basic",
  name: "Basic VC v1 Credential",
  description: "Minimal W3C Verifiable Credential Data Model v1 credential with only required fields",
  spec: "vc-v1",
  profile: "generic",
  features: [],
  source: "spec-example",
  signed: false,
  validity: "valid",
  validator: import_types.UnsignedVCValidator,
  credential: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: "http://example.org/credentials/3731",
    type: ["VerifiableCredential"],
    issuer: "did:example:issuer123",
    issuanceDate: "2020-08-19T21:41:50Z",
    credentialSubject: {
      id: "did:example:subject456"
    }
  }
};

// src/fixtures/vc-v1/with-status.ts
var import_types2 = require("@learncard/types");
var vcV1WithStatus = {
  id: "vc-v1/with-status",
  name: "VC v1 with Credential Status",
  description: "W3C VCDM v1 credential with credentialStatus for revocation checking (StatusList2021)",
  spec: "vc-v1",
  profile: "generic",
  features: ["status"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types2.UnsignedVCValidator,
  credential: {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/vc/status-list/2021/v1"
    ],
    id: "http://example.org/credentials/status-example",
    type: ["VerifiableCredential"],
    issuer: "did:example:issuer123",
    issuanceDate: "2023-06-15T10:00:00Z",
    expirationDate: "2025-06-15T10:00:00Z",
    credentialSubject: {
      id: "did:example:subject456",
      degree: {
        type: "BachelorDegree",
        name: "Bachelor of Science in Computer Science"
      }
    },
    credentialStatus: {
      id: "https://example.com/credentials/status/1#42",
      type: "StatusList2021Entry",
      statusPurpose: "revocation",
      statusListIndex: "42",
      statusListCredential: "https://example.com/credentials/status/1"
    }
  }
};

// src/fixtures/vc-v2/basic.ts
var import_types3 = require("@learncard/types");
var vcV2Basic = {
  id: "vc-v2/basic",
  name: "Basic VC v2 Credential",
  description: "Minimal W3C Verifiable Credential Data Model v2 credential using validFrom instead of issuanceDate",
  spec: "vc-v2",
  profile: "generic",
  features: [],
  source: "spec-example",
  signed: false,
  validity: "valid",
  validator: import_types3.UnsignedVCValidator,
  credential: {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: "urn:uuid:58172aac-d8ba-11ed-83dd-0b3aef56cc33",
    type: ["VerifiableCredential"],
    issuer: "did:example:issuer123",
    validFrom: "2023-06-15T10:00:00Z",
    credentialSubject: {
      id: "did:example:subject456"
    }
  }
};

// src/fixtures/vc-v2/with-evidence.ts
var import_types4 = require("@learncard/types");
var vcV2WithEvidence = {
  id: "vc-v2/with-evidence",
  name: "VC v2 with Evidence",
  description: "W3C VCDM v2 credential with evidence array documenting supporting artifacts",
  spec: "vc-v2",
  profile: "generic",
  features: ["evidence"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types4.UnsignedVCValidator,
  credential: {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: "urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    type: ["VerifiableCredential"],
    issuer: {
      id: "did:example:issuer123",
      name: "Example University"
    },
    validFrom: "2023-09-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:student789",
      degree: {
        type: "MasterDegree",
        name: "Master of Science in Data Engineering"
      }
    },
    evidence: [
      {
        type: ["Evidence", "DocumentVerification"],
        name: "Transcript Review",
        description: "Official transcript reviewed and verified by registrar office."
      },
      {
        type: ["Evidence", "ThesisDefense"],
        name: "Thesis Defense",
        narrative: 'Student successfully defended thesis titled "Scalable Data Pipelines" on 2023-06-20.'
      }
    ]
  }
};

// src/fixtures/vc-v2/multiple-subjects.ts
var import_types5 = require("@learncard/types");
var vcV2MultipleSubjects = {
  id: "vc-v2/multiple-subjects",
  name: "VC v2 with Multiple Credential Subjects",
  description: "W3C VCDM v2 credential with an array of credentialSubjects, which is valid per spec but uncommon",
  spec: "vc-v2",
  profile: "generic",
  features: ["multiple-subjects"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types5.UnsignedVCValidator,
  tags: ["edge-case"],
  credential: {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: "urn:uuid:b2c3d4e5-f6a7-8901-bcde-f12345678901",
    type: ["VerifiableCredential"],
    issuer: "did:example:issuer123",
    validFrom: "2024-01-15T00:00:00Z",
    credentialSubject: [
      {
        id: "did:example:alice",
        role: "Team Lead"
      },
      {
        id: "did:example:bob",
        role: "Developer"
      }
    ]
  }
};

// src/fixtures/obv3/minimal-badge.ts
var import_types6 = require("@learncard/types");
var obv3MinimalBadge = {
  id: "obv3/minimal-badge",
  name: "Minimal OBv3 Badge",
  description: "Open Badges v3 achievement credential with only required fields per the 1EdTech spec",
  spec: "obv3",
  profile: "badge",
  features: [],
  source: "spec-example",
  signed: false,
  validity: "valid",
  validator: import_types6.UnsignedAchievementCredentialValidator,
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    id: "urn:uuid:a1b2c3d4-0001-4000-8000-000000000001",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: { id: "did:example:issuer123" },
    validFrom: "2024-01-01T00:00:00Z",
    name: "Minimal Badge",
    credentialSubject: {
      id: "did:example:subject456",
      type: ["AchievementSubject"],
      achievement: {
        id: "urn:uuid:a1b2c3d4-0001-4000-8000-000000000002",
        type: ["Achievement"],
        name: "Participation",
        description: "Awarded for attending the event.",
        criteria: { narrative: "Must attend the event." }
      }
    }
  }
};

// src/fixtures/obv3/full-badge.ts
var import_types7 = require("@learncard/types");
var obv3FullBadge = {
  id: "obv3/full-badge",
  name: "Full-Featured OBv3 Badge",
  description: "Open Badges v3 credential exercising most optional fields: image, evidence, alignment, results, rich issuer profile, expiration",
  spec: "obv3",
  profile: "badge",
  features: ["image", "evidence", "alignment", "results", "expiration"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types7.UnsignedAchievementCredentialValidator,
  tags: ["comprehensive"],
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    id: "urn:uuid:b2c3d4e5-0002-4000-8000-000000000001",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: "Advanced Web Development",
    description: "Demonstrates mastery of modern web development frameworks and tooling.",
    image: {
      id: "https://example.com/badges/webdev.png",
      type: "Image",
      caption: "Advanced Web Development Badge"
    },
    issuer: {
      id: "did:example:issuer123",
      type: ["Profile"],
      name: "Tech Academy",
      url: "https://techacademy.example.com",
      image: {
        id: "https://techacademy.example.com/logo.png",
        type: "Image"
      },
      email: "badges@techacademy.example.com"
    },
    validFrom: "2024-03-01T00:00:00Z",
    validUntil: "2027-03-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:student789",
      type: ["AchievementSubject"],
      activityStartDate: "2024-01-15T00:00:00Z",
      activityEndDate: "2024-02-28T00:00:00Z",
      creditsEarned: 3,
      achievement: {
        id: "urn:uuid:b2c3d4e5-0002-4000-8000-000000000002",
        type: ["Achievement"],
        achievementType: "Certificate",
        name: "Advanced Web Development",
        description: "Covers React, TypeScript, Node.js, and modern deployment pipelines.",
        humanCode: "WEB-401",
        fieldOfStudy: "Computer Science",
        creditsAvailable: 3,
        criteria: {
          id: "https://techacademy.example.com/criteria/web401",
          narrative: "Complete all 12 modules, pass the final project with 80%+, and submit a capstone portfolio."
        },
        image: {
          id: "https://example.com/badges/webdev.png",
          type: "Image"
        },
        alignment: [
          {
            type: ["Alignment"],
            targetName: "Web Application Development",
            targetUrl: "https://credentialfinder.org/competency/12345",
            targetType: "ceasn:Competency",
            targetFramework: "NICE Cybersecurity Workforce Framework"
          }
        ],
        resultDescription: [
          {
            id: "urn:uuid:b2c3d4e5-0002-4000-8000-000000000003",
            type: ["ResultDescription"],
            name: "Final Project Score",
            resultType: "Percent",
            valueMin: "0",
            valueMax: "100"
          },
          {
            id: "urn:uuid:b2c3d4e5-0002-4000-8000-000000000004",
            type: ["ResultDescription"],
            name: "Completion Status",
            resultType: "Status"
          }
        ],
        tag: ["web-development", "react", "typescript", "nodejs"]
      },
      result: [
        {
          type: ["Result"],
          resultDescription: "urn:uuid:b2c3d4e5-0002-4000-8000-000000000003",
          value: "92"
        },
        {
          type: ["Result"],
          resultDescription: "urn:uuid:b2c3d4e5-0002-4000-8000-000000000004",
          status: "Completed"
        }
      ]
    },
    evidence: [
      {
        type: ["Evidence"],
        id: "https://techacademy.example.com/evidence/student789/capstone",
        name: "Capstone Portfolio",
        description: "Student capstone portfolio demonstrating applied web development skills.",
        narrative: "Reviewed and approved by course instructor on 2024-02-28."
      }
    ]
  }
};

// src/fixtures/obv3/with-alignment.ts
var import_types8 = require("@learncard/types");
var obv3WithAlignment = {
  id: "obv3/with-alignment",
  name: "OBv3 Badge with Competency Alignments",
  description: "Open Badges v3 credential with alignment to external competency frameworks (CTDL, CASE)",
  spec: "obv3",
  profile: "badge",
  features: ["alignment"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types8.UnsignedAchievementCredentialValidator,
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    id: "urn:uuid:e5f6a7b8-0005-4000-8000-000000000001",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: "Data Science Fundamentals",
    issuer: { id: "did:example:datauniversity" },
    validFrom: "2024-06-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:learner101",
      type: ["AchievementSubject"],
      achievement: {
        id: "urn:uuid:e5f6a7b8-0005-4000-8000-000000000002",
        type: ["Achievement"],
        achievementType: "Course",
        name: "Data Science Fundamentals",
        description: "Introductory course covering statistics, machine learning basics, and data visualization.",
        criteria: {
          narrative: "Complete all assignments and pass the final exam with 70%+."
        },
        alignment: [
          {
            type: ["Alignment"],
            targetName: "Data Analysis",
            targetUrl: "https://credentialfinder.org/competency/data-analysis",
            targetType: "ceasn:Competency",
            targetFramework: "O*NET",
            targetDescription: "Ability to collect, organize, interpret, and present data."
          },
          {
            type: ["Alignment"],
            targetName: "Statistical Methods",
            targetUrl: "https://casenetwork.example.com/cfitems/stat-methods",
            targetType: "CFItem",
            targetFramework: "CASE Mathematics Framework"
          }
        ]
      }
    }
  }
};

// src/fixtures/obv3/with-endorsement.ts
var import_types9 = require("@learncard/types");
var obv3WithEndorsement = {
  id: "obv3/with-endorsement",
  name: "OBv3 Badge with Endorsement",
  description: "Open Badges v3 credential containing an embedded endorsement credential from a third party",
  spec: "obv3",
  profile: "badge",
  features: ["endorsement"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types9.UnsignedAchievementCredentialValidator,
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    id: "urn:uuid:c3d4e5f6-0003-4000-8000-000000000001",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: "Endorsed Teamwork Badge",
    issuer: { id: "did:example:issuer123", type: ["Profile"], name: "Acme Corp" },
    validFrom: "2024-05-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:employee42",
      type: ["AchievementSubject"],
      achievement: {
        id: "urn:uuid:c3d4e5f6-0003-4000-8000-000000000002",
        type: ["Achievement"],
        name: "Teamwork Excellence",
        description: "Recognizes outstanding collaborative skills in cross-functional teams.",
        criteria: { narrative: "Nominated by peers and approved by management." }
      }
    },
    endorsement: [
      {
        "@context": [
          "https://www.w3.org/ns/credentials/v2",
          "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
        ],
        id: "urn:uuid:c3d4e5f6-0003-4000-8000-000000000003",
        type: ["VerifiableCredential", "EndorsementCredential"],
        issuer: {
          id: "did:example:endorser999",
          type: ["Profile"],
          name: "Industry Standards Board"
        },
        validFrom: "2024-04-01T00:00:00Z",
        credentialSubject: {
          id: "urn:uuid:c3d4e5f6-0003-4000-8000-000000000002",
          type: ["EndorsementSubject"],
          endorsementComment: "This badge program meets industry standards for collaborative skill assessment."
        }
      }
    ]
  }
};

// src/fixtures/obv3/plugfest-jff2.ts
var import_types10 = require("@learncard/types");
var obv3PlugfestJff2 = {
  id: "obv3/plugfest-jff2",
  name: "JFF x vc-edu PlugFest 2 Interoperability Badge",
  description: "Real-world OBv3 credential from the JFF PlugFest 2 interoperability event, demonstrating cross-wallet compatibility",
  spec: "obv3",
  profile: "badge",
  features: ["image"],
  source: "plugfest",
  signed: false,
  validity: "valid",
  validator: import_types10.UnsignedAchievementCredentialValidator,
  tags: ["jff", "interop", "plugfest"],
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    id: "urn:uuid:d4e5f6a7-0004-4000-8000-000000000001",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: "JFF x vc-edu PlugFest 2 Interoperability",
    issuer: {
      type: ["Profile"],
      id: "did:example:jff",
      name: "Jobs for the Future (JFF)",
      image: {
        id: "https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png",
        type: "Image"
      }
    },
    validFrom: "2023-01-01T00:00:00Z",
    credentialSubject: {
      type: ["AchievementSubject"],
      id: "did:example:subject456",
      achievement: {
        id: "urn:uuid:d4e5f6a7-0004-4000-8000-000000000002",
        type: ["Achievement"],
        name: "JFF x vc-edu PlugFest 2 Interoperability",
        description: "This credential solution supports the use of OBv3 and w3c Verifiable Credentials and is interoperable with at least two other solutions. This was demonstrated successfully during JFF x vc-edu PlugFest 2.",
        criteria: {
          narrative: "Solutions providers earned this badge by demonstrating interoperability between multiple providers based on the OBv3 candidate final standard, with some additional required fields. Credential issuers earning this badge successfully issued a credential into at least two wallets. Wallet implementers earning this badge successfully displayed credentials issued by at least two different credential issuers."
        },
        image: {
          id: "https://w3c-ccg.github.io/vc-ed/plugfest-2-2022/images/JFF-VC-EDU-PLUGFEST2-badge-image.png",
          type: "Image"
        }
      }
    }
  }
};

// src/fixtures/clr/minimal.ts
var import_types11 = require("@learncard/types");
var clrMinimal = {
  id: "clr/minimal",
  name: "Minimal CLR v2 Credential",
  description: "Minimal Comprehensive Learner Record v2 wrapping a single achievement, per 1EdTech CLR Standard",
  spec: "clr-v2",
  profile: "learner-record",
  features: [],
  source: "spec-example",
  signed: false,
  validity: "valid",
  validator: import_types11.UnsignedClrCredentialValidator,
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json"
    ],
    id: "urn:uuid:f6a7b8c9-0006-4000-8000-000000000001",
    type: ["VerifiableCredential", "ClrCredential"],
    name: "Academic Record \u2014 Spring 2024",
    issuer: {
      id: "did:example:stateuniversity",
      type: ["Profile"],
      name: "State University"
    },
    validFrom: "2024-06-15T00:00:00Z",
    credentialSubject: {
      id: "did:example:student101",
      type: ["ClrSubject"],
      achievement: [
        {
          id: "urn:uuid:f6a7b8c9-0006-4000-8000-000000000002",
          type: ["Achievement"],
          achievementType: "Course",
          name: "Introduction to Psychology",
          description: "Survey course covering major psychological theories and research methods.",
          criteria: {
            narrative: "Complete coursework and pass final exam."
          },
          humanCode: "PSY-101",
          fieldOfStudy: "Psychology",
          creditsAvailable: 3
        }
      ]
    }
  }
};

// src/fixtures/clr/multi-achievement.ts
var import_types12 = require("@learncard/types");
var clrMultiAchievement = {
  id: "clr/multi-achievement",
  name: "CLR v2 with Multiple Achievements and Associations",
  description: "Comprehensive Learner Record with multiple achievements linked by associations, demonstrating the full CLR data model",
  spec: "clr-v2",
  profile: "learner-record",
  features: ["associations", "alignment"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types12.UnsignedClrCredentialValidator,
  tags: ["comprehensive"],
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json"
    ],
    id: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000001",
    type: ["VerifiableCredential", "ClrCredential"],
    name: "Associate of Science \u2014 Computer Science",
    description: "Full academic transcript for the AS in Computer Science program.",
    issuer: {
      id: "did:example:communitycollegeXYZ",
      type: ["Profile"],
      name: "Community College XYZ",
      url: "https://ccxyz.example.edu"
    },
    validFrom: "2024-12-20T00:00:00Z",
    credentialSubject: {
      id: "did:example:student202",
      type: ["ClrSubject"],
      achievement: [
        {
          id: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000010",
          type: ["Achievement"],
          achievementType: "Course",
          name: "Programming I",
          description: "Introduction to programming using Python.",
          humanCode: "CS-110",
          fieldOfStudy: "Computer Science",
          creditsAvailable: 4,
          criteria: { narrative: "Complete all labs and pass final project." }
        },
        {
          id: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000011",
          type: ["Achievement"],
          achievementType: "Course",
          name: "Programming II",
          description: "Data structures and algorithms in Python.",
          humanCode: "CS-210",
          fieldOfStudy: "Computer Science",
          creditsAvailable: 4,
          criteria: { narrative: "Complete all labs and pass the final exam." }
        },
        {
          id: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000012",
          type: ["Achievement"],
          achievementType: "Course",
          name: "Calculus I",
          description: "Limits, derivatives, and integrals.",
          humanCode: "MATH-151",
          fieldOfStudy: "Mathematics",
          creditsAvailable: 4,
          criteria: { narrative: "Pass midterm and final exams with 60%+." }
        },
        {
          id: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000013",
          type: ["Achievement"],
          achievementType: "AssociateDegree",
          name: "Associate of Science in Computer Science",
          description: "Two-year degree program in computer science.",
          humanCode: "AS-CS",
          fieldOfStudy: "Computer Science",
          creditsAvailable: 60,
          criteria: {
            narrative: "Complete all required courses with a cumulative GPA of 2.0 or higher."
          },
          alignment: [
            {
              type: ["Alignment"],
              targetName: "Computer Science",
              targetUrl: "https://nces.ed.gov/cip/110101",
              targetType: "CTDL",
              targetFramework: "CIP"
            }
          ]
        }
      ],
      association: [
        {
          type: ["Association"],
          associationType: "isChildOf",
          targetId: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000013",
          sourceId: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000010"
        },
        {
          type: ["Association"],
          associationType: "isChildOf",
          targetId: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000013",
          sourceId: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000011"
        },
        {
          type: ["Association"],
          associationType: "isChildOf",
          targetId: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000013",
          sourceId: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000012"
        },
        {
          type: ["Association"],
          associationType: "precedes",
          targetId: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000011",
          sourceId: "urn:uuid:a7b8c9d0-0007-4000-8000-000000000010"
        }
      ]
    }
  }
};

// src/fixtures/boost/basic.ts
var import_types13 = require("@learncard/types");
var boostBasic = {
  id: "boost/basic",
  name: "Basic LearnCard Boost",
  description: "LearnCard BoostCredential \u2014 an OBv3-compatible badge with the BoostCredential extension context",
  spec: "obv3",
  profile: "boost",
  features: ["display"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types13.UnsignedAchievementCredentialValidator,
  tags: ["learncard", "boost"],
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://ctx.learncard.com/boosts/1.0.3.json"
    ],
    id: "urn:uuid:b8c9d0e1-0008-4000-8000-000000000001",
    type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
    name: "Community Contributor",
    issuer: { id: "did:example:orgABC" },
    validFrom: "2024-07-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:member42",
      type: ["AchievementSubject"],
      achievement: {
        id: "urn:uuid:b8c9d0e1-0008-4000-8000-000000000002",
        type: ["Achievement"],
        achievementType: "Badge",
        name: "Community Contributor",
        description: "Recognized for making meaningful contributions to the community.",
        image: "https://example.com/badges/contributor.png",
        criteria: {
          narrative: "Contribute to at least 3 community projects."
        }
      }
    },
    display: {
      backgroundColor: "#2563EB",
      backgroundImage: ""
    }
  }
};

// src/fixtures/boost/boost-id.ts
var import_types14 = require("@learncard/types");
var boostId = {
  id: "boost/boost-id",
  name: "LearnCard Boost ID",
  description: "LearnCard BoostID credential \u2014 an identity-style credential with custom display, used for membership cards and IDs",
  spec: "obv3",
  profile: "boost-id",
  features: ["display", "image"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types14.UnsignedAchievementCredentialValidator,
  tags: ["learncard", "boost", "id"],
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://ctx.learncard.com/boosts/1.0.3.json",
      "https://ctx.learncard.com/boostIDs/1.0.0.json"
    ],
    id: "urn:uuid:c9d0e1f2-0009-4000-8000-000000000001",
    type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential", "BoostID"],
    name: "Scouts Troop 42 Member ID",
    issuer: { id: "did:example:troopLeader" },
    validFrom: "2024-09-01T00:00:00Z",
    validUntil: "2025-09-01T00:00:00Z",
    image: "https://example.com/troop42/badge.png",
    credentialSubject: {
      id: "did:example:scout123",
      type: ["AchievementSubject"],
      achievement: {
        id: "urn:uuid:c9d0e1f2-0009-4000-8000-000000000002",
        type: ["Achievement"],
        achievementType: "Membership",
        name: "Troop 42 Membership",
        description: "Active member of Scouts Troop 42.",
        image: "",
        criteria: {
          narrative: "Registered and active in the current program year."
        }
      }
    },
    display: {
      backgroundColor: "#16A34A",
      backgroundImage: ""
    },
    boostID: {
      fontColor: "#FFFFFF",
      accentColor: "#15803D",
      idBackgroundColor: "#16A34A",
      repeatIdBackgroundImage: false
    }
  }
};

// src/fixtures/boost/with-skills.ts
var import_types15 = require("@learncard/types");
var boostWithSkills = {
  id: "boost/with-skills",
  name: "LearnCard Boost with Skills",
  description: "LearnCard BoostCredential with attached skills taxonomy, evidence files, and alignment",
  spec: "obv3",
  profile: "boost",
  features: ["skills", "evidence", "alignment"],
  source: "synthetic",
  signed: false,
  validity: "valid",
  validator: import_types15.UnsignedAchievementCredentialValidator,
  tags: ["learncard", "boost", "skills"],
  credential: {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://ctx.learncard.com/boosts/1.0.3.json"
    ],
    id: "urn:uuid:d0e1f2a3-0010-4000-8000-000000000001",
    type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
    name: "Full-Stack Developer Certification",
    issuer: { id: "did:example:bootcamp" },
    validFrom: "2024-11-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:graduate55",
      type: ["AchievementSubject"],
      achievement: {
        id: "urn:uuid:d0e1f2a3-0010-4000-8000-000000000002",
        type: ["Achievement"],
        achievementType: "Certification",
        name: "Full-Stack Developer",
        description: "Completed 16-week intensive full-stack bootcamp.",
        image: "",
        criteria: {
          narrative: "Complete all coursework, capstone project, and pass technical assessments."
        },
        alignment: [
          {
            type: ["Alignment"],
            targetName: "Full Stack Web Developer",
            targetUrl: "https://www.onetonline.org/link/summary/15-1254.00",
            targetType: "CTDL",
            targetFramework: "O*NET-SOC"
          }
        ]
      }
    },
    evidence: [
      {
        type: ["Evidence", "EvidenceFile"],
        name: "Capstone Project Repository",
        description: "GitHub repository for capstone full-stack application."
      }
    ],
    skills: [
      {
        category: "Frontend",
        skill: "React",
        subskills: ["Hooks", "Context API", "Server Components"]
      },
      {
        category: "Backend",
        skill: "Node.js",
        subskills: ["Express", "REST APIs", "Authentication"]
      },
      {
        category: "Database",
        skill: "PostgreSQL",
        subskills: ["Schema Design", "Migrations", "Query Optimization"]
      }
    ]
  }
};

// src/fixtures/invalid/missing-context.ts
var import_types16 = require("@learncard/types");
var invalidMissingContext = {
  id: "invalid/missing-context",
  name: "Missing @context",
  description: "Credential with no @context array \u2014 should fail validation since @context is required by the VC Data Model",
  spec: "vc-v2",
  profile: "generic",
  features: [],
  source: "synthetic",
  signed: false,
  validity: "invalid",
  validator: import_types16.UnsignedVCValidator,
  tags: ["negative-test"],
  credential: {
    // Intentionally missing '@context'
    id: "urn:uuid:invalid-0001",
    type: ["VerifiableCredential"],
    issuer: "did:example:issuer123",
    validFrom: "2024-01-01T00:00:00Z",
    credentialSubject: { id: "did:example:subject456" }
  }
};

// src/fixtures/invalid/empty-type.ts
var import_types17 = require("@learncard/types");
var invalidEmptyType = {
  id: "invalid/empty-type",
  name: "Empty type Array",
  description: 'Credential with an empty type array \u2014 should fail validation since type must be a non-empty array containing at least "VerifiableCredential"',
  spec: "vc-v2",
  profile: "generic",
  features: [],
  source: "synthetic",
  signed: false,
  validity: "invalid",
  validator: import_types17.UnsignedVCValidator,
  tags: ["negative-test"],
  credential: {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: "urn:uuid:invalid-0002",
    type: [],
    issuer: "did:example:issuer123",
    validFrom: "2024-01-01T00:00:00Z",
    credentialSubject: { id: "did:example:subject456" }
  }
};

// src/fixtures/invalid/missing-issuer.ts
var import_types18 = require("@learncard/types");
var invalidMissingIssuer = {
  id: "invalid/missing-issuer",
  name: "Missing Issuer",
  description: "Credential with no issuer field \u2014 should fail validation since issuer is required by the VC Data Model",
  spec: "vc-v2",
  profile: "generic",
  features: [],
  source: "synthetic",
  signed: false,
  validity: "invalid",
  validator: import_types18.UnsignedVCValidator,
  tags: ["negative-test"],
  credential: {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: "urn:uuid:invalid-0003",
    type: ["VerifiableCredential"],
    // Intentionally missing 'issuer'
    validFrom: "2024-01-01T00:00:00Z",
    credentialSubject: { id: "did:example:subject456" }
  }
};

// src/fixtures/index.ts
var ALL_FIXTURES = [
  // VC v1
  vcV1Basic,
  vcV1WithStatus,
  // VC v2
  vcV2Basic,
  vcV2WithEvidence,
  vcV2MultipleSubjects,
  // OBv3
  obv3MinimalBadge,
  obv3FullBadge,
  obv3WithAlignment,
  obv3WithEndorsement,
  obv3PlugfestJff2,
  // CLR v2
  clrMinimal,
  clrMultiAchievement,
  // Boosts
  boostBasic,
  boostId,
  boostWithSkills,
  // Invalid
  invalidMissingContext,
  invalidEmptyType,
  invalidMissingIssuer
];
registerFixtures(ALL_FIXTURES);
//# sourceMappingURL=credential-library.cjs.development.js.map
