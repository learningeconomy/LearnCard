/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Nameplaceholder3Inputs */

const en_developerportal_credentialbuilder_achievement_nameplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Nameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Web Development Fundamentals`)
};

const es_developerportal_credentialbuilder_achievement_nameplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Nameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Fundamentos de Desarrollo Web`)
};

const fr_developerportal_credentialbuilder_achievement_nameplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Nameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Fondamentaux du Développement Web`)
};

const ar_developerportal_credentialbuilder_achievement_nameplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Nameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: أساسيات تطوير الويب`)
};

/**
* | output |
* | --- |
* | "e.g., Web Development Fundamentals" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Nameplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_nameplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Nameplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Nameplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_nameplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_nameplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_nameplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_achievement_nameplaceholder3(inputs)
});
export { developerportal_credentialbuilder_achievement_nameplaceholder3 as "developerPortal.credentialBuilder.achievement.namePlaceholder" }