/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Creditsavailable3Inputs */

const en_developerportal_credentialbuilder_achievement_creditsavailable3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Creditsavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credits Available`)
};

const es_developerportal_credentialbuilder_achievement_creditsavailable3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Creditsavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créditos Disponibles`)
};

const fr_developerportal_credentialbuilder_achievement_creditsavailable3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Creditsavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crédits Disponibles`)
};

const ar_developerportal_credentialbuilder_achievement_creditsavailable3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Creditsavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاعتمادات المتاحة`)
};

/**
* | output |
* | --- |
* | "Credits Available" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Creditsavailable3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_creditsavailable3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Creditsavailable3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Creditsavailable3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_creditsavailable3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_creditsavailable3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_creditsavailable3(inputs)
	return ar_developerportal_credentialbuilder_achievement_creditsavailable3(inputs)
});
export { developerportal_credentialbuilder_achievement_creditsavailable3 as "developerPortal.credentialBuilder.achievement.creditsAvailable" }