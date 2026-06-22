/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Name2Inputs */

const en_developerportal_credentialbuilder_achievement_name2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Name2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievement Name`)
};

const es_developerportal_credentialbuilder_achievement_name2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Name2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Logro`)
};

const fr_developerportal_credentialbuilder_achievement_name2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Name2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de la Réalisation`)
};

const ar_developerportal_credentialbuilder_achievement_name2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Name2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الإنجاز`)
};

/**
* | output |
* | --- |
* | "Achievement Name" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Name2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_name2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Name2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Name2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_name2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_name2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_name2(inputs)
	return ar_developerportal_credentialbuilder_achievement_name2(inputs)
});
export { developerportal_credentialbuilder_achievement_name2 as "developerPortal.credentialBuilder.achievement.name" }