/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Humancodehelp4Inputs */

const en_developerportal_credentialbuilder_achievement_humancodehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Humancodehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Human-readable code (course number)`)
};

const es_developerportal_credentialbuilder_achievement_humancodehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Humancodehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código legible por humanos (número de curso)`)
};

const fr_developerportal_credentialbuilder_achievement_humancodehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Humancodehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code lisible par l'humain (numéro de cours)`)
};

const ar_developerportal_credentialbuilder_achievement_humancodehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Humancodehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز قابل للقراءة البشرية (رقم المقرر)`)
};

/**
* | output |
* | --- |
* | "Human-readable code (course number)" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Humancodehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_humancodehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Humancodehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Humancodehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_humancodehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_humancodehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_humancodehelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_humancodehelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_humancodehelp4 as "developerPortal.credentialBuilder.achievement.humanCodeHelp" }