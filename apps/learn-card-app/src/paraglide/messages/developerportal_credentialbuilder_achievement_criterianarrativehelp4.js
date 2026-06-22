/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Criterianarrativehelp4Inputs */

const en_developerportal_credentialbuilder_achievement_criterianarrativehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrativehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Human-readable description of the criteria`)
};

const es_developerportal_credentialbuilder_achievement_criterianarrativehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrativehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción legible de los criterios`)
};

const fr_developerportal_credentialbuilder_achievement_criterianarrativehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrativehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description lisible des critères`)
};

const ar_developerportal_credentialbuilder_achievement_criterianarrativehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrativehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصف قابل للقراءة للمعايير`)
};

/**
* | output |
* | --- |
* | "Human-readable description of the criteria" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Criterianarrativehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_criterianarrativehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Criterianarrativehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Criterianarrativehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_criterianarrativehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_criterianarrativehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_criterianarrativehelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_criterianarrativehelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_criterianarrativehelp4 as "developerPortal.credentialBuilder.achievement.criteriaNarrativeHelp" }