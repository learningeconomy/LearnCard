/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Descriptionhelp3Inputs */

const en_developerportal_credentialbuilder_evidence_descriptionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Descriptionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A longer description of this evidence`)
};

const es_developerportal_credentialbuilder_evidence_descriptionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Descriptionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una descripción más larga de esta evidencia`)
};

const fr_developerportal_credentialbuilder_evidence_descriptionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Descriptionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une description plus longue de cette preuve`)
};

const ar_developerportal_credentialbuilder_evidence_descriptionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Descriptionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصف أطول لهذا الدليل`)
};

/**
* | output |
* | --- |
* | "A longer description of this evidence" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Descriptionhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_descriptionhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Descriptionhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Descriptionhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_descriptionhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_descriptionhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_descriptionhelp3(inputs)
	return ar_developerportal_credentialbuilder_evidence_descriptionhelp3(inputs)
});
export { developerportal_credentialbuilder_evidence_descriptionhelp3 as "developerPortal.credentialBuilder.evidence.descriptionHelp" }