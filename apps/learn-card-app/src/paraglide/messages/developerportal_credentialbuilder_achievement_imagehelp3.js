/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Imagehelp3Inputs */

const en_developerportal_credentialbuilder_achievement_imagehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Imagehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge or achievement image URL`)
};

const es_developerportal_credentialbuilder_achievement_imagehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Imagehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la imagen de la insignia o logro`)
};

const fr_developerportal_credentialbuilder_achievement_imagehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Imagehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de l'image du badge ou de la réalisation`)
};

const ar_developerportal_credentialbuilder_achievement_imagehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Imagehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط URL لصورة الشارة أو الإنجاز`)
};

/**
* | output |
* | --- |
* | "Badge or achievement image URL" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Imagehelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_imagehelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Imagehelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Imagehelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_imagehelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_imagehelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_imagehelp3(inputs)
	return ar_developerportal_credentialbuilder_achievement_imagehelp3(inputs)
});
export { developerportal_credentialbuilder_achievement_imagehelp3 as "developerPortal.credentialBuilder.achievement.imageHelp" }