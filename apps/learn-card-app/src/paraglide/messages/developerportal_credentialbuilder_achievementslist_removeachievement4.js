/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Removeachievement4Inputs */

const en_developerportal_credentialbuilder_achievementslist_removeachievement4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Removeachievement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove achievement`)
};

const es_developerportal_credentialbuilder_achievementslist_removeachievement4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Removeachievement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar logro`)
};

const fr_developerportal_credentialbuilder_achievementslist_removeachievement4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Removeachievement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer la réalisation`)
};

const ar_developerportal_credentialbuilder_achievementslist_removeachievement4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Removeachievement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة الإنجاز`)
};

/**
* | output |
* | --- |
* | "Remove achievement" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Removeachievement4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_removeachievement4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Removeachievement4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Removeachievement4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_removeachievement4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_removeachievement4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_removeachievement4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_removeachievement4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_removeachievement4 as "developerPortal.credentialBuilder.achievementsList.removeAchievement" }