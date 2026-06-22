/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Results2Inputs */

const en_developerportal_credentialbuilder_recipient_results2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Results2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results (Grades/Scores)`)
};

const es_developerportal_credentialbuilder_recipient_results2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Results2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resultados (Calificaciones)`)
};

const fr_developerportal_credentialbuilder_recipient_results2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Results2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultats (Notes)`)
};

const ar_developerportal_credentialbuilder_recipient_results2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Results2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النتائج (الدرجات)`)
};

/**
* | output |
* | --- |
* | "Results (Grades/Scores)" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Results2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_results2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Results2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Results2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_results2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_results2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_results2(inputs)
	return ar_developerportal_credentialbuilder_recipient_results2(inputs)
});
export { developerportal_credentialbuilder_recipient_results2 as "developerPortal.credentialBuilder.recipient.results" }