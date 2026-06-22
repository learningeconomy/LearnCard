/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Narrativeplaceholder3Inputs */

const en_developerportal_credentialbuilder_evidence_narrativeplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Narrativeplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe the process and achievement that led to this evidence...`)
};

const es_developerportal_credentialbuilder_evidence_narrativeplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Narrativeplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe el proceso y logro que llevó a esta evidencia...`)
};

const fr_developerportal_credentialbuilder_evidence_narrativeplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Narrativeplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décrivez le processus et la réalisation qui ont conduit à cette preuve...`)
};

const ar_developerportal_credentialbuilder_evidence_narrativeplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Narrativeplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صِف العملية والإنجاز الذي أدى إلى هذا الدليل...`)
};

/**
* | output |
* | --- |
* | "Describe the process and achievement that led to this evidence..." |
*
* @param {Developerportal_Credentialbuilder_Evidence_Narrativeplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_narrativeplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Narrativeplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Narrativeplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_narrativeplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_narrativeplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_narrativeplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_evidence_narrativeplaceholder3(inputs)
});
export { developerportal_credentialbuilder_evidence_narrativeplaceholder3 as "developerPortal.credentialBuilder.evidence.narrativePlaceholder" }