/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Imageupload_Uploading2Inputs */

const en_developerportal_components_imageupload_uploading2 = /** @type {(inputs: Developerportal_Components_Imageupload_Uploading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploading...`)
};

const es_developerportal_components_imageupload_uploading2 = /** @type {(inputs: Developerportal_Components_Imageupload_Uploading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subiendo...`)
};

const fr_developerportal_components_imageupload_uploading2 = /** @type {(inputs: Developerportal_Components_Imageupload_Uploading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargement...`)
};

const ar_developerportal_components_imageupload_uploading2 = /** @type {(inputs: Developerportal_Components_Imageupload_Uploading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الرفع...`)
};

/**
* | output |
* | --- |
* | "Uploading..." |
*
* @param {Developerportal_Components_Imageupload_Uploading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_imageupload_uploading2 = /** @type {((inputs?: Developerportal_Components_Imageupload_Uploading2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Imageupload_Uploading2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_imageupload_uploading2(inputs)
	if (locale === "es") return es_developerportal_components_imageupload_uploading2(inputs)
	if (locale === "fr") return fr_developerportal_components_imageupload_uploading2(inputs)
	return ar_developerportal_components_imageupload_uploading2(inputs)
});
export { developerportal_components_imageupload_uploading2 as "developerPortal.components.imageUpload.uploading" }