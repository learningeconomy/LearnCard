/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Evidenceurlplaceholder4Inputs */

const en_developerportal_credentialbuilder_evidence_evidenceurlplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurlplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://portfolio.example.com/project`)
};

const es_developerportal_credentialbuilder_evidence_evidenceurlplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurlplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://portafolio.ejemplo.com/proyecto`)
};

const fr_developerportal_credentialbuilder_evidence_evidenceurlplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurlplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://portfolio.exemple.com/projet`)
};

const ar_developerportal_credentialbuilder_evidence_evidenceurlplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurlplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://portfolio.example.com/project`)
};

/**
* | output |
* | --- |
* | "https://portfolio.example.com/project" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Evidenceurlplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_evidenceurlplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Evidenceurlplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Evidenceurlplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_evidenceurlplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_evidenceurlplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_evidenceurlplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_evidence_evidenceurlplaceholder4(inputs)
});
export { developerportal_credentialbuilder_evidence_evidenceurlplaceholder4 as "developerPortal.credentialBuilder.evidence.evidenceUrlPlaceholder" }