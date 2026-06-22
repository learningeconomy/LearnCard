/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Tagshelp3Inputs */

const en_developerportal_credentialbuilder_achievement_tagshelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tagshelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keywords for categorization`)
};

const es_developerportal_credentialbuilder_achievement_tagshelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tagshelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Palabras clave para categorización`)
};

const fr_developerportal_credentialbuilder_achievement_tagshelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tagshelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mots-clés pour la catégorisation`)
};

const ar_developerportal_credentialbuilder_achievement_tagshelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tagshelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمات مفتاحية للتصنيف`)
};

/**
* | output |
* | --- |
* | "Keywords for categorization" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Tagshelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_tagshelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Tagshelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Tagshelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_tagshelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_tagshelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_tagshelp3(inputs)
	return ar_developerportal_credentialbuilder_achievement_tagshelp3(inputs)
});
export { developerportal_credentialbuilder_achievement_tagshelp3 as "developerPortal.credentialBuilder.achievement.tagsHelp" }