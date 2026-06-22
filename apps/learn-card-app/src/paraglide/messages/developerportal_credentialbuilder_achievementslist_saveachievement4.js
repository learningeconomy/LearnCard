/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Saveachievement4Inputs */

const en_developerportal_credentialbuilder_achievementslist_saveachievement4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Saveachievement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Achievement`)
};

const es_developerportal_credentialbuilder_achievementslist_saveachievement4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Saveachievement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar Logro`)
};

const fr_developerportal_credentialbuilder_achievementslist_saveachievement4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Saveachievement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer la Réalisation`)
};

const ar_developerportal_credentialbuilder_achievementslist_saveachievement4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Saveachievement4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ الإنجاز`)
};

/**
* | output |
* | --- |
* | "Save Achievement" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Saveachievement4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_saveachievement4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Saveachievement4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Saveachievement4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_saveachievement4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_saveachievement4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_saveachievement4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_saveachievement4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_saveachievement4 as "developerPortal.credentialBuilder.achievementsList.saveAchievement" }