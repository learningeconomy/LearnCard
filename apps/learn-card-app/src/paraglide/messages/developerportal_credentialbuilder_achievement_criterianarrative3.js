/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Criterianarrative3Inputs */

const en_developerportal_credentialbuilder_achievement_criterianarrative3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrative3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criteria Narrative`)
};

const es_developerportal_credentialbuilder_achievement_criterianarrative3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrative3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Narrativa de Criterios`)
};

const fr_developerportal_credentialbuilder_achievement_criterianarrative3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrative3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récit des Critères`)
};

const ar_developerportal_credentialbuilder_achievement_criterianarrative3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrative3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سرد المعايير`)
};

/**
* | output |
* | --- |
* | "Criteria Narrative" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Criterianarrative3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_criterianarrative3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Criterianarrative3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Criterianarrative3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_criterianarrative3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_criterianarrative3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_criterianarrative3(inputs)
	return ar_developerportal_credentialbuilder_achievement_criterianarrative3(inputs)
});
export { developerportal_credentialbuilder_achievement_criterianarrative3 as "developerPortal.credentialBuilder.achievement.criteriaNarrative" }