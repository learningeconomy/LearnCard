/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Noachievements4Inputs */

const en_developerportal_credentialbuilder_achievementslist_noachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Noachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No achievements added`)
};

const es_developerportal_credentialbuilder_achievementslist_noachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Noachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se añadieron logros`)
};

const fr_developerportal_credentialbuilder_achievementslist_noachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Noachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune réalisation ajoutée`)
};

const ar_developerportal_credentialbuilder_achievementslist_noachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Noachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة إنجازات`)
};

/**
* | output |
* | --- |
* | "No achievements added" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Noachievements4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_noachievements4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Noachievements4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Noachievements4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_noachievements4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_noachievements4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_noachievements4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_noachievements4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_noachievements4 as "developerPortal.credentialBuilder.achievementsList.noAchievements" }