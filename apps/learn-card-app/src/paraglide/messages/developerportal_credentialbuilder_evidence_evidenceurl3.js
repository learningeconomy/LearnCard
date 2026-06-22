/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Evidenceurl3Inputs */

const en_developerportal_credentialbuilder_evidence_evidenceurl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evidence URL`)
};

const es_developerportal_credentialbuilder_evidence_evidenceurl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la Evidencia`)
};

const fr_developerportal_credentialbuilder_evidence_evidenceurl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la Preuve`)
};

const ar_developerportal_credentialbuilder_evidence_evidenceurl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط الدليل`)
};

/**
* | output |
* | --- |
* | "Evidence URL" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Evidenceurl3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_evidenceurl3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Evidenceurl3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Evidenceurl3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_evidenceurl3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_evidenceurl3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_evidenceurl3(inputs)
	return ar_developerportal_credentialbuilder_evidence_evidenceurl3(inputs)
});
export { developerportal_credentialbuilder_evidence_evidenceurl3 as "developerPortal.credentialBuilder.evidence.evidenceUrl" }