/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Specialization2Inputs */

const en_developerportal_credentialbuilder_achievement_specialization2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specialization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Specialization`)
};

const es_developerportal_credentialbuilder_achievement_specialization2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specialization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Especialización`)
};

const fr_developerportal_credentialbuilder_achievement_specialization2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specialization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spécialisation`)
};

const ar_developerportal_credentialbuilder_achievement_specialization2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specialization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التخصص`)
};

/**
* | output |
* | --- |
* | "Specialization" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Specialization2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_specialization2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Specialization2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Specialization2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_specialization2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_specialization2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_specialization2(inputs)
	return ar_developerportal_credentialbuilder_achievement_specialization2(inputs)
});
export { developerportal_credentialbuilder_achievement_specialization2 as "developerPortal.credentialBuilder.achievement.specialization" }