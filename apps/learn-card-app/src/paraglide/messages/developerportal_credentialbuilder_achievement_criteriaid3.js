/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Criteriaid3Inputs */

const en_developerportal_credentialbuilder_achievement_criteriaid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criteria ID`)
};

const es_developerportal_credentialbuilder_achievement_criteriaid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Criterios`)
};

const fr_developerportal_credentialbuilder_achievement_criteriaid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID des Critères`)
};

const ar_developerportal_credentialbuilder_achievement_criteriaid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criteriaid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المعايير`)
};

/**
* | output |
* | --- |
* | "Criteria ID" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Criteriaid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_criteriaid3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Criteriaid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Criteriaid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_criteriaid3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_criteriaid3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_criteriaid3(inputs)
	return ar_developerportal_credentialbuilder_achievement_criteriaid3(inputs)
});
export { developerportal_credentialbuilder_achievement_criteriaid3 as "developerPortal.credentialBuilder.achievement.criteriaId" }