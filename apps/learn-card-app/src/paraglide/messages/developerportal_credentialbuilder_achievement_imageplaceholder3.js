/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Imageplaceholder3Inputs */

const en_developerportal_credentialbuilder_achievement_imageplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Imageplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/badge-image.png`)
};

const es_developerportal_credentialbuilder_achievement_imageplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Imageplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://ejemplo.com/insignia.png`)
};

const fr_developerportal_credentialbuilder_achievement_imageplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Imageplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://exemple.com/badge.png`)
};

const ar_developerportal_credentialbuilder_achievement_imageplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Imageplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/badge-image.png`)
};

/**
* | output |
* | --- |
* | "https://example.com/badge-image.png" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Imageplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_imageplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Imageplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Imageplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_imageplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_imageplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_imageplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_achievement_imageplaceholder3(inputs)
});
export { developerportal_credentialbuilder_achievement_imageplaceholder3 as "developerPortal.credentialBuilder.achievement.imagePlaceholder" }