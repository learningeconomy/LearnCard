/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Languages_Pt_Pt4Inputs */

const en_developerportal_credentialbuilder_achievement_languages_pt_pt4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Pt_Pt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portuguese (Portugal)`)
};

const es_developerportal_credentialbuilder_achievement_languages_pt_pt4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Pt_Pt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portuguese (Portugal)`)
};

const fr_developerportal_credentialbuilder_achievement_languages_pt_pt4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Pt_Pt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portuguese (Portugal)`)
};

const ar_developerportal_credentialbuilder_achievement_languages_pt_pt4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Pt_Pt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portuguese (Portugal)`)
};

/**
* | output |
* | --- |
* | "Portuguese (Portugal)" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Languages_Pt_Pt4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_languages_pt_pt4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Languages_Pt_Pt4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Languages_Pt_Pt4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_languages_pt_pt4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_languages_pt_pt4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_languages_pt_pt4(inputs)
	return ar_developerportal_credentialbuilder_achievement_languages_pt_pt4(inputs)
});
export { developerportal_credentialbuilder_achievement_languages_pt_pt4 as "developerPortal.credentialBuilder.achievement.languages.pt-PT" }