/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Generatedtype3Inputs */

const en_developerportal_credentialbuilder_achievement_generatedtype3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Generatedtype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generated type:`)
};

const es_developerportal_credentialbuilder_achievement_generatedtype3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Generatedtype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo generado:`)
};

const fr_developerportal_credentialbuilder_achievement_generatedtype3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Generatedtype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type généré :`)
};

const ar_developerportal_credentialbuilder_achievement_generatedtype3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Generatedtype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النوع المُنشأ:`)
};

/**
* | output |
* | --- |
* | "Generated type:" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Generatedtype3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_generatedtype3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Generatedtype3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Generatedtype3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_generatedtype3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_generatedtype3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_generatedtype3(inputs)
	return ar_developerportal_credentialbuilder_achievement_generatedtype3(inputs)
});
export { developerportal_credentialbuilder_achievement_generatedtype3 as "developerPortal.credentialBuilder.achievement.generatedType" }