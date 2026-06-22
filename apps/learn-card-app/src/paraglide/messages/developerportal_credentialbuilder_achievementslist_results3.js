/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Results3Inputs */

const en_developerportal_credentialbuilder_achievementslist_results3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Results3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results`)
};

const es_developerportal_credentialbuilder_achievementslist_results3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Results3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resultados`)
};

const fr_developerportal_credentialbuilder_achievementslist_results3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Results3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultats`)
};

const ar_developerportal_credentialbuilder_achievementslist_results3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Results3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النتائج`)
};

/**
* | output |
* | --- |
* | "Results" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Results3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_results3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Results3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Results3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_results3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_results3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_results3(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_results3(inputs)
});
export { developerportal_credentialbuilder_achievementslist_results3 as "developerPortal.credentialBuilder.achievementsList.results" }