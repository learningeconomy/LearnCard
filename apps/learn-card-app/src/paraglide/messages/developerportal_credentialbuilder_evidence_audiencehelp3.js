/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Audiencehelp3Inputs */

const en_developerportal_credentialbuilder_evidence_audiencehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audiencehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who this evidence is intended for`)
};

const es_developerportal_credentialbuilder_evidence_audiencehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audiencehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Para quién está destinada esta evidencia`)
};

const fr_developerportal_credentialbuilder_evidence_audiencehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audiencehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À qui cette preuve est destinée`)
};

const ar_developerportal_credentialbuilder_evidence_audiencehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audiencehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لمن هذا الدليل موجه`)
};

/**
* | output |
* | --- |
* | "Who this evidence is intended for" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Audiencehelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_audiencehelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Audiencehelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Audiencehelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_audiencehelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_audiencehelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_audiencehelp3(inputs)
	return ar_developerportal_credentialbuilder_evidence_audiencehelp3(inputs)
});
export { developerportal_credentialbuilder_evidence_audiencehelp3 as "developerPortal.credentialBuilder.evidence.audienceHelp" }