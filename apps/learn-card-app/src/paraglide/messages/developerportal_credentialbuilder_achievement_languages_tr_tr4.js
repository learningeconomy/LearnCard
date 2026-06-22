/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Languages_Tr_Tr4Inputs */

const en_developerportal_credentialbuilder_achievement_languages_tr_tr4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Tr_Tr4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Turkish`)
};

const es_developerportal_credentialbuilder_achievement_languages_tr_tr4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Tr_Tr4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Turkish`)
};

const fr_developerportal_credentialbuilder_achievement_languages_tr_tr4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Tr_Tr4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Turkish`)
};

const ar_developerportal_credentialbuilder_achievement_languages_tr_tr4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Tr_Tr4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Turkish`)
};

/**
* | output |
* | --- |
* | "Turkish" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Languages_Tr_Tr4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_languages_tr_tr4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Languages_Tr_Tr4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Languages_Tr_Tr4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_languages_tr_tr4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_languages_tr_tr4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_languages_tr_tr4(inputs)
	return ar_developerportal_credentialbuilder_achievement_languages_tr_tr4(inputs)
});
export { developerportal_credentialbuilder_achievement_languages_tr_tr4 as "developerPortal.credentialBuilder.achievement.languages.tr-TR" }