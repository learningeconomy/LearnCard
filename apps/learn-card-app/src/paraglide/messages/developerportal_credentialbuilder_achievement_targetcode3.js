/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Targetcode3Inputs */

const en_developerportal_credentialbuilder_achievement_targetcode3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Target Code`)
};

const es_developerportal_credentialbuilder_achievement_targetcode3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código del Objetivo`)
};

const fr_developerportal_credentialbuilder_achievement_targetcode3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code de la Cible`)
};

const ar_developerportal_credentialbuilder_achievement_targetcode3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز الهدف`)
};

/**
* | output |
* | --- |
* | "Target Code" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Targetcode3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_targetcode3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Targetcode3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Targetcode3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_targetcode3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_targetcode3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_targetcode3(inputs)
	return ar_developerportal_credentialbuilder_achievement_targetcode3(inputs)
});
export { developerportal_credentialbuilder_achievement_targetcode3 as "developerPortal.credentialBuilder.achievement.targetCode" }