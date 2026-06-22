/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ n: NonNullable<unknown> }} Developerportal_Credentialbuilder_Evidence_Evidencenumber3Inputs */

const en_developerportal_credentialbuilder_evidence_evidencenumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Evidence ${i?.n}`)
};

const es_developerportal_credentialbuilder_evidence_evidencenumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Evidencia ${i?.n}`)
};

const fr_developerportal_credentialbuilder_evidence_evidencenumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Preuve ${i?.n}`)
};

const ar_developerportal_credentialbuilder_evidence_evidencenumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`دليل ${i?.n}`)
};

/**
* | output |
* | --- |
* | "Evidence {n}" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Evidencenumber3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_evidencenumber3 = /** @type {((inputs: Developerportal_Credentialbuilder_Evidence_Evidencenumber3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Evidencenumber3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_evidencenumber3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_evidencenumber3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_evidencenumber3(inputs)
	return ar_developerportal_credentialbuilder_evidence_evidencenumber3(inputs)
});
export { developerportal_credentialbuilder_evidence_evidencenumber3 as "developerPortal.credentialBuilder.evidence.evidenceNumber" }