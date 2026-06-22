/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Addevidence3Inputs */

const en_developerportal_credentialbuilder_evidence_addevidence3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Addevidence3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Evidence`)
};

const es_developerportal_credentialbuilder_evidence_addevidence3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Addevidence3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Evidencia`)
};

const fr_developerportal_credentialbuilder_evidence_addevidence3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Addevidence3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une Preuve`)
};

const ar_developerportal_credentialbuilder_evidence_addevidence3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Addevidence3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة دليل`)
};

/**
* | output |
* | --- |
* | "Add Evidence" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Addevidence3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_addevidence3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Addevidence3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Addevidence3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_addevidence3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_addevidence3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_addevidence3(inputs)
	return ar_developerportal_credentialbuilder_evidence_addevidence3(inputs)
});
export { developerportal_credentialbuilder_evidence_addevidence3 as "developerPortal.credentialBuilder.evidence.addEvidence" }