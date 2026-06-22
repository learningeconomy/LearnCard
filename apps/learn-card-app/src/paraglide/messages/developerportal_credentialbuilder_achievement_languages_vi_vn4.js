/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Languages_Vi_Vn4Inputs */

const en_developerportal_credentialbuilder_achievement_languages_vi_vn4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Vi_Vn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vietnamese`)
};

const es_developerportal_credentialbuilder_achievement_languages_vi_vn4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Vi_Vn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vietnamese`)
};

const fr_developerportal_credentialbuilder_achievement_languages_vi_vn4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Vi_Vn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vietnamese`)
};

const ar_developerportal_credentialbuilder_achievement_languages_vi_vn4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Vi_Vn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vietnamese`)
};

/**
* | output |
* | --- |
* | "Vietnamese" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Languages_Vi_Vn4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_languages_vi_vn4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Languages_Vi_Vn4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Languages_Vi_Vn4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_languages_vi_vn4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_languages_vi_vn4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_languages_vi_vn4(inputs)
	return ar_developerportal_credentialbuilder_achievement_languages_vi_vn4(inputs)
});
export { developerportal_credentialbuilder_achievement_languages_vi_vn4 as "developerPortal.credentialBuilder.achievement.languages.vi-VN" }