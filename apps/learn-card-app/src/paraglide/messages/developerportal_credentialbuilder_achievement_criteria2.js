/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Criteria2Inputs */

const en_developerportal_credentialbuilder_achievement_criteria2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criteria`)
};

const es_developerportal_credentialbuilder_achievement_criteria2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criterios`)
};

const fr_developerportal_credentialbuilder_achievement_criteria2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Critères`)
};

const ar_developerportal_credentialbuilder_achievement_criteria2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعايير`)
};

/**
* | output |
* | --- |
* | "Criteria" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Criteria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_criteria2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Criteria2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Criteria2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_criteria2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_criteria2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_criteria2(inputs)
	return ar_developerportal_credentialbuilder_achievement_criteria2(inputs)
});
export { developerportal_credentialbuilder_achievement_criteria2 as "developerPortal.credentialBuilder.achievement.criteria" }