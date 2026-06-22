/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Targeturl3Inputs */

const en_developerportal_credentialbuilder_achievement_targeturl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targeturl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Target URL`)
};

const es_developerportal_credentialbuilder_achievement_targeturl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targeturl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL del Objetivo`)
};

const fr_developerportal_credentialbuilder_achievement_targeturl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targeturl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la Cible`)
};

const ar_developerportal_credentialbuilder_achievement_targeturl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targeturl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط الهدف`)
};

/**
* | output |
* | --- |
* | "Target URL" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Targeturl3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_targeturl3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Targeturl3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Targeturl3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_targeturl3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_targeturl3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_targeturl3(inputs)
	return ar_developerportal_credentialbuilder_achievement_targeturl3(inputs)
});
export { developerportal_credentialbuilder_achievement_targeturl3 as "developerPortal.credentialBuilder.achievement.targetUrl" }