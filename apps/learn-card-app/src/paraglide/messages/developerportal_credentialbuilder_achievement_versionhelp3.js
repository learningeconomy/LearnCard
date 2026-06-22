/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Versionhelp3Inputs */

const en_developerportal_credentialbuilder_achievement_versionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Versionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Version of this achievement`)
};

const es_developerportal_credentialbuilder_achievement_versionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Versionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Versión de este logro`)
};

const fr_developerportal_credentialbuilder_achievement_versionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Versionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Version de cette réalisation`)
};

const ar_developerportal_credentialbuilder_achievement_versionhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Versionhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار هذا الإنجاز`)
};

/**
* | output |
* | --- |
* | "Version of this achievement" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Versionhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_versionhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Versionhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Versionhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_versionhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_versionhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_versionhelp3(inputs)
	return ar_developerportal_credentialbuilder_achievement_versionhelp3(inputs)
});
export { developerportal_credentialbuilder_achievement_versionhelp3 as "developerPortal.credentialBuilder.achievement.versionHelp" }