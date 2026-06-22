/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Credentialinfo_Imagehelp4Inputs */

const en_developerportal_credentialbuilder_credentialinfo_imagehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Imagehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL to an image representing the credential`)
};

const es_developerportal_credentialbuilder_credentialinfo_imagehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Imagehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de una imagen que represente la credencial`)
};

const fr_developerportal_credentialbuilder_credentialinfo_imagehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Imagehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL d'une image représentant le crédential`)
};

const ar_developerportal_credentialbuilder_credentialinfo_imagehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Imagehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط URL لصورة تمثل الاعتماد`)
};

/**
* | output |
* | --- |
* | "URL to an image representing the credential" |
*
* @param {Developerportal_Credentialbuilder_Credentialinfo_Imagehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_credentialinfo_imagehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Credentialinfo_Imagehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Credentialinfo_Imagehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_credentialinfo_imagehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_credentialinfo_imagehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_credentialinfo_imagehelp4(inputs)
	return ar_developerportal_credentialbuilder_credentialinfo_imagehelp4(inputs)
});
export { developerportal_credentialbuilder_credentialinfo_imagehelp4 as "developerPortal.credentialBuilder.credentialInfo.imageHelp" }