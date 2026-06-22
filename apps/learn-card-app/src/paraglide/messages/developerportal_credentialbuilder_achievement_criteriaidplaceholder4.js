/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Criteriaidplaceholder4Inputs */

const en_developerportal_credentialbuilder_achievement_criteriaidplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaidplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/criteria/...`)
};

const es_developerportal_credentialbuilder_achievement_criteriaidplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaidplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://ejemplo.com/criterios/...`)
};

const fr_developerportal_credentialbuilder_achievement_criteriaidplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaidplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://exemple.com/criteres/...`)
};

const ar_developerportal_credentialbuilder_achievement_criteriaidplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaidplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/criteria/...`)
};

/**
* | output |
* | --- |
* | "https://example.com/criteria/..." |
*
* @param {Developerportal_Credentialbuilder_Achievement_Criteriaidplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_criteriaidplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Criteriaidplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Criteriaidplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_criteriaidplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_criteriaidplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_criteriaidplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_achievement_criteriaidplaceholder4(inputs)
});
export { developerportal_credentialbuilder_achievement_criteriaidplaceholder4 as "developerPortal.credentialBuilder.achievement.criteriaIdPlaceholder" }