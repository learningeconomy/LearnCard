/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Noresults4Inputs */

const en_developerportal_credentialbuilder_achievementslist_noresults4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Noresults4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No results added`)
};

const es_developerportal_credentialbuilder_achievementslist_noresults4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Noresults4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados añadidos`)
};

const fr_developerportal_credentialbuilder_achievementslist_noresults4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Noresults4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat ajouté`)
};

const ar_developerportal_credentialbuilder_achievementslist_noresults4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Noresults4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة نتائج`)
};

/**
* | output |
* | --- |
* | "No results added" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Noresults4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_noresults4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Noresults4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Noresults4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_noresults4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_noresults4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_noresults4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_noresults4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_noresults4 as "developerPortal.credentialBuilder.achievementsList.noResults" }