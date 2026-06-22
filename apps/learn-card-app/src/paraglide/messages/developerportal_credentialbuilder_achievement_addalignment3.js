/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Addalignment3Inputs */

const en_developerportal_credentialbuilder_achievement_addalignment3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Addalignment3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Alignment`)
};

const es_developerportal_credentialbuilder_achievement_addalignment3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Addalignment3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Alineación`)
};

const fr_developerportal_credentialbuilder_achievement_addalignment3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Addalignment3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un Alignement`)
};

const ar_developerportal_credentialbuilder_achievement_addalignment3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Addalignment3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة محاذاة`)
};

/**
* | output |
* | --- |
* | "Add Alignment" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Addalignment3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_addalignment3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Addalignment3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Addalignment3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_addalignment3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_addalignment3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_addalignment3(inputs)
	return ar_developerportal_credentialbuilder_achievement_addalignment3(inputs)
});
export { developerportal_credentialbuilder_achievement_addalignment3 as "developerPortal.credentialBuilder.achievement.addAlignment" }