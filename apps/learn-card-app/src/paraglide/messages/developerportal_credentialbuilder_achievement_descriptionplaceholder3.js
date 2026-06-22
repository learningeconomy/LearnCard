/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Descriptionplaceholder3Inputs */

const en_developerportal_credentialbuilder_achievement_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe the achievement...`)
};

const es_developerportal_credentialbuilder_achievement_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe el logro...`)
};

const fr_developerportal_credentialbuilder_achievement_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décrivez la réalisation...`)
};

const ar_developerportal_credentialbuilder_achievement_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صِف الإنجاز...`)
};

/**
* | output |
* | --- |
* | "Describe the achievement..." |
*
* @param {Developerportal_Credentialbuilder_Achievement_Descriptionplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_descriptionplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Descriptionplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Descriptionplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_descriptionplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_descriptionplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_descriptionplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_achievement_descriptionplaceholder3(inputs)
});
export { developerportal_credentialbuilder_achievement_descriptionplaceholder3 as "developerPortal.credentialBuilder.achievement.descriptionPlaceholder" }