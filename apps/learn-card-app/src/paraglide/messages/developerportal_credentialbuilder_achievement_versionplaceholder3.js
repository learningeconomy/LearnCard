/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Versionplaceholder3Inputs */

const en_developerportal_credentialbuilder_achievement_versionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Versionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., 1.0`)
};

const es_developerportal_credentialbuilder_achievement_versionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Versionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., 1.0`)
};

const fr_developerportal_credentialbuilder_achievement_versionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Versionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., 1.0`)
};

const ar_developerportal_credentialbuilder_achievement_versionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Versionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: 1.0`)
};

/**
* | output |
* | --- |
* | "e.g., 1.0" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Versionplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_versionplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Versionplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Versionplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_versionplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_versionplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_versionplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_achievement_versionplaceholder3(inputs)
});
export { developerportal_credentialbuilder_achievement_versionplaceholder3 as "developerPortal.credentialBuilder.achievement.versionPlaceholder" }