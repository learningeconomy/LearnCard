/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Targeturlhelp4Inputs */

const en_developerportal_credentialbuilder_achievement_targeturlhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targeturlhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL to the standard or framework`)
};

const es_developerportal_credentialbuilder_achievement_targeturlhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targeturlhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL del estándar o marco`)
};

const fr_developerportal_credentialbuilder_achievement_targeturlhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targeturlhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la norme ou du cadre`)
};

const ar_developerportal_credentialbuilder_achievement_targeturlhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targeturlhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط URL للمعيار أو الإطار`)
};

/**
* | output |
* | --- |
* | "URL to the standard or framework" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Targeturlhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_targeturlhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Targeturlhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Targeturlhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_targeturlhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_targeturlhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_targeturlhelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_targeturlhelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_targeturlhelp4 as "developerPortal.credentialBuilder.achievement.targetUrlHelp" }