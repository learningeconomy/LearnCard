/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Targetcodehelp4Inputs */

const en_developerportal_credentialbuilder_achievement_targetcodehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetcodehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code within the framework`)
};

const es_developerportal_credentialbuilder_achievement_targetcodehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetcodehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código dentro del marco`)
};

const fr_developerportal_credentialbuilder_achievement_targetcodehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetcodehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code dans le cadre`)
};

const ar_developerportal_credentialbuilder_achievement_targetcodehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetcodehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرمز داخل الإطار`)
};

/**
* | output |
* | --- |
* | "Code within the framework" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Targetcodehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_targetcodehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Targetcodehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Targetcodehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_targetcodehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_targetcodehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_targetcodehelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_targetcodehelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_targetcodehelp4 as "developerPortal.credentialBuilder.achievement.targetCodeHelp" }