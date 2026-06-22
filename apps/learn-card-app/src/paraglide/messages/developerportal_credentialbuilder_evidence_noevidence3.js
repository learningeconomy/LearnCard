/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Noevidence3Inputs */

const en_developerportal_credentialbuilder_evidence_noevidence3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Noevidence3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No evidence items added`)
};

const es_developerportal_credentialbuilder_evidence_noevidence3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Noevidence3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin elementos de evidencia añadidos`)
};

const fr_developerportal_credentialbuilder_evidence_noevidence3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Noevidence3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune preuve ajoutée`)
};

const ar_developerportal_credentialbuilder_evidence_noevidence3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Noevidence3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة أدلة`)
};

/**
* | output |
* | --- |
* | "No evidence items added" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Noevidence3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_noevidence3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Noevidence3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Noevidence3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_noevidence3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_noevidence3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_noevidence3(inputs)
	return ar_developerportal_credentialbuilder_evidence_noevidence3(inputs)
});
export { developerportal_credentialbuilder_evidence_noevidence3 as "developerPortal.credentialBuilder.evidence.noEvidence" }