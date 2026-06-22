/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Audience2Inputs */

const en_developerportal_credentialbuilder_evidence_audience2 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Audience`)
};

const es_developerportal_credentialbuilder_evidence_audience2 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Audiencia`)
};

const fr_developerportal_credentialbuilder_evidence_audience2 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Public`)
};

const ar_developerportal_credentialbuilder_evidence_audience2 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الجمهور`)
};

/**
* | output |
* | --- |
* | "Audience" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Audience2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_audience2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Audience2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Audience2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_audience2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_audience2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_audience2(inputs)
	return ar_developerportal_credentialbuilder_evidence_audience2(inputs)
});
export { developerportal_credentialbuilder_evidence_audience2 as "developerPortal.credentialBuilder.evidence.audience" }