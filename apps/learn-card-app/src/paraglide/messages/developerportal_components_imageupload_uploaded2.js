/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Imageupload_Uploaded2Inputs */

const en_developerportal_components_imageupload_uploaded2 = /** @type {(inputs: Developerportal_Components_Imageupload_Uploaded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploaded`)
};

const es_developerportal_components_imageupload_uploaded2 = /** @type {(inputs: Developerportal_Components_Imageupload_Uploaded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subido`)
};

const fr_developerportal_components_imageupload_uploaded2 = /** @type {(inputs: Developerportal_Components_Imageupload_Uploaded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléversé`)
};

const ar_developerportal_components_imageupload_uploaded2 = /** @type {(inputs: Developerportal_Components_Imageupload_Uploaded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الرفع`)
};

/**
* | output |
* | --- |
* | "Uploaded" |
*
* @param {Developerportal_Components_Imageupload_Uploaded2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_imageupload_uploaded2 = /** @type {((inputs?: Developerportal_Components_Imageupload_Uploaded2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Imageupload_Uploaded2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_imageupload_uploaded2(inputs)
	if (locale === "es") return es_developerportal_components_imageupload_uploaded2(inputs)
	if (locale === "fr") return fr_developerportal_components_imageupload_uploaded2(inputs)
	return ar_developerportal_components_imageupload_uploaded2(inputs)
});
export { developerportal_components_imageupload_uploaded2 as "developerPortal.components.imageUpload.uploaded" }