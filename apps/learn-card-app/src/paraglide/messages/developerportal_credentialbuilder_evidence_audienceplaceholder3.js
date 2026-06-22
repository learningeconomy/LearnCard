/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Audienceplaceholder3Inputs */

const en_developerportal_credentialbuilder_evidence_audienceplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audienceplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Hiring Managers`)
};

const es_developerportal_credentialbuilder_evidence_audienceplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audienceplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Gerentes de Contratación`)
};

const fr_developerportal_credentialbuilder_evidence_audienceplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audienceplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Responsables du Recrutement`)
};

const ar_developerportal_credentialbuilder_evidence_audienceplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Audienceplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: مديرو التوظيف`)
};

/**
* | output |
* | --- |
* | "e.g., Hiring Managers" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Audienceplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_audienceplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Audienceplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Audienceplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_audienceplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_audienceplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_audienceplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_evidence_audienceplaceholder3(inputs)
});
export { developerportal_credentialbuilder_evidence_audienceplaceholder3 as "developerPortal.credentialBuilder.evidence.audiencePlaceholder" }