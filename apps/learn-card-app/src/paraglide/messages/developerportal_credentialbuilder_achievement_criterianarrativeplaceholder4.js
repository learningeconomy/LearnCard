/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Criterianarrativeplaceholder4Inputs */

const en_developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrativeplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe what was required to earn this achievement...`)
};

const es_developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrativeplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe lo que se requería para obtener este logro...`)
};

const fr_developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrativeplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décrivez ce qui était requis pour obtenir cette réalisation...`)
};

const ar_developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Criterianarrativeplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صِف ما هو مطلوب لكسب هذا الإنجاز...`)
};

/**
* | output |
* | --- |
* | "Describe what was required to earn this achievement..." |
*
* @param {Developerportal_Credentialbuilder_Achievement_Criterianarrativeplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Criterianarrativeplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Criterianarrativeplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4(inputs)
});
export { developerportal_credentialbuilder_achievement_criterianarrativeplaceholder4 as "developerPortal.credentialBuilder.achievement.criteriaNarrativePlaceholder" }