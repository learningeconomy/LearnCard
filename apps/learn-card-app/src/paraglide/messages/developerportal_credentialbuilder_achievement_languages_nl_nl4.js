/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Languages_Nl_Nl4Inputs */

const en_developerportal_credentialbuilder_achievement_languages_nl_nl4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Nl_Nl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dutch`)
};

const es_developerportal_credentialbuilder_achievement_languages_nl_nl4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Nl_Nl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dutch`)
};

const fr_developerportal_credentialbuilder_achievement_languages_nl_nl4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Nl_Nl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dutch`)
};

const ar_developerportal_credentialbuilder_achievement_languages_nl_nl4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Languages_Nl_Nl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dutch`)
};

/**
* | output |
* | --- |
* | "Dutch" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Languages_Nl_Nl4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_languages_nl_nl4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Languages_Nl_Nl4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Languages_Nl_Nl4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_languages_nl_nl4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_languages_nl_nl4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_languages_nl_nl4(inputs)
	return ar_developerportal_credentialbuilder_achievement_languages_nl_nl4(inputs)
});
export { developerportal_credentialbuilder_achievement_languages_nl_nl4 as "developerPortal.credentialBuilder.achievement.languages.nl-NL" }