/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Creditsearnedplaceholder5Inputs */

const en_developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., 3`)
};

const es_developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., 3`)
};

const fr_developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., 3`)
};

const ar_developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: 3`)
};

/**
* | output |
* | --- |
* | "e.g., 3" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Creditsearnedplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Creditsearnedplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5(inputs)
});
export { developerportal_credentialbuilder_achievementslist_creditsearnedplaceholder5 as "developerPortal.credentialBuilder.achievementsList.creditsEarnedPlaceholder" }