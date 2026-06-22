/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Evidencenameplaceholder4Inputs */

const en_developerportal_credentialbuilder_evidence_evidencenameplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Final Project Submission`)
};

const es_developerportal_credentialbuilder_evidence_evidencenameplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Entrega del Proyecto Final`)
};

const fr_developerportal_credentialbuilder_evidence_evidencenameplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Soumission du Projet Final`)
};

const ar_developerportal_credentialbuilder_evidence_evidencenameplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: تسليم المشروع النهائي`)
};

/**
* | output |
* | --- |
* | "e.g., Final Project Submission" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Evidencenameplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_evidencenameplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Evidencenameplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Evidencenameplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_evidencenameplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_evidencenameplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_evidencenameplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_evidence_evidencenameplaceholder4(inputs)
});
export { developerportal_credentialbuilder_evidence_evidencenameplaceholder4 as "developerPortal.credentialBuilder.evidence.evidenceNamePlaceholder" }