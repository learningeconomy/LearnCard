/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Specializationplaceholder3Inputs */

const en_developerportal_credentialbuilder_achievement_specializationplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specializationplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Web Development`)
};

const es_developerportal_credentialbuilder_achievement_specializationplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specializationplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Desarrollo Web`)
};

const fr_developerportal_credentialbuilder_achievement_specializationplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specializationplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Développement Web`)
};

const ar_developerportal_credentialbuilder_achievement_specializationplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specializationplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: تطوير الويب`)
};

/**
* | output |
* | --- |
* | "e.g., Web Development" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Specializationplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_specializationplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Specializationplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Specializationplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_specializationplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_specializationplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_specializationplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_achievement_specializationplaceholder3(inputs)
});
export { developerportal_credentialbuilder_achievement_specializationplaceholder3 as "developerPortal.credentialBuilder.achievement.specializationPlaceholder" }