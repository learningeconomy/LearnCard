/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Languages_Es_Mx4Inputs */

const en_developerportal_credentialbuilder_achievement_languages_es_mx4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Es_Mx4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spanish (Mexico)`)
};

const es_developerportal_credentialbuilder_achievement_languages_es_mx4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Es_Mx4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spanish (Mexico)`)
};

const fr_developerportal_credentialbuilder_achievement_languages_es_mx4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Es_Mx4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spanish (Mexico)`)
};

const ar_developerportal_credentialbuilder_achievement_languages_es_mx4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Es_Mx4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spanish (Mexico)`)
};

/**
* | output |
* | --- |
* | "Spanish (Mexico)" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Languages_Es_Mx4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_languages_es_mx4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Languages_Es_Mx4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Languages_Es_Mx4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_languages_es_mx4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_languages_es_mx4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_languages_es_mx4(inputs)
	return ar_developerportal_credentialbuilder_achievement_languages_es_mx4(inputs)
});
export { developerportal_credentialbuilder_achievement_languages_es_mx4 as "developerPortal.credentialBuilder.achievement.languages.es-MX" }