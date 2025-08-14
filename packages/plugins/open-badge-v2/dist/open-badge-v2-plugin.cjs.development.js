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
  OBV2_WRAPPER_CONTEXT_URL: () => OBV2_WRAPPER_CONTEXT_URL,
  openBadgeV2Plugin: () => openBadgeV2Plugin
});
module.exports = __toCommonJS(src_exports);

// src/types.ts
var OBV2_WRAPPER_CONTEXT_URL = "https://docs.learncard.com/wrappers/obv2/1.0.0.json";

// src/plugin.ts
var VC_V2_CONTEXT = "https://www.w3.org/ns/credentials/v2";
var isUrl = /* @__PURE__ */ __name((value) => /^(https?:)?\/\//i.test(value) || value.startsWith("ipfs://") || value.startsWith("ipns://"), "isUrl");
async function getObv2Assertion(input) {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!isUrl(trimmed) && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        throw new Error("wrapOpenBadgeV2: Provided string is not a valid URL or JSON");
      }
    }
    const res = await fetch(trimmed);
    if (!res.ok)
      throw new Error(`wrapOpenBadgeV2: Failed to fetch OBv2 assertion: ${res.status}`);
    return await res.json();
  }
  return input;
}
__name(getObv2Assertion, "getObv2Assertion");
function validateObv2(obv2) {
  if (!obv2 || typeof obv2 !== "object")
    throw new Error("wrapOpenBadgeV2: Missing assertion");
  const id = obv2.id;
  if (typeof id !== "string" || !id.length)
    throw new Error("wrapOpenBadgeV2: assertion.id is required");
  const t = obv2.type;
  const hasAssertionType = typeof t === "string" && t === "Assertion" || Array.isArray(t) && t.includes("Assertion");
  if (!hasAssertionType)
    throw new Error("wrapOpenBadgeV2: assertion.type must include 'Assertion'");
  if (!obv2.issuedOn || typeof obv2.issuedOn !== "string") {
    throw new Error("wrapOpenBadgeV2: assertion.issuedOn (string) is required");
  }
}
__name(validateObv2, "validateObv2");
var openBadgeV2Plugin = /* @__PURE__ */ __name((learnCard) => ({
  name: "OpenBadgeV2",
  displayName: "OpenBadge v2 Wrapper",
  description: "Wrap legacy OpenBadge v2.0 assertions into self-issued Verifiable Credentials",
  methods: {
    wrapOpenBadgeV2: async (_learnCard, obv2Assertion) => {
      const issuerDid = learnCard.id.did();
      const obv2 = await getObv2Assertion(obv2Assertion);
      validateObv2(obv2);
      const unsigned = {
        "@context": [VC_V2_CONTEXT, OBV2_WRAPPER_CONTEXT_URL],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ["VerifiableCredential", "LegacyOpenBadgeCredential"],
        issuer: issuerDid,
        validFrom: new Date().toISOString(),
        credentialSubject: {
          id: issuerDid,
          legacyAssertion: obv2
        }
      };
      return learnCard.invoke.issueCredential(unsigned, { proofPurpose: "assertionMethod" });
    }
  }
}), "openBadgeV2Plugin");
//# sourceMappingURL=open-badge-v2-plugin.cjs.development.js.map
