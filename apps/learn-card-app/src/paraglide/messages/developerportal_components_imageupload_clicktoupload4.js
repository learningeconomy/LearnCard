/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Imageupload_Clicktoupload4Inputs */

const en_developerportal_components_imageupload_clicktoupload4 = /** @type {(inputs: Developerportal_Components_Imageupload_Clicktoupload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Click to upload image`)
};

const es_developerportal_components_imageupload_clicktoupload4 = /** @type {(inputs: Developerportal_Components_Imageupload_Clicktoupload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz clic para subir imagen`)
};

const fr_developerportal_components_imageupload_clicktoupload4 = /** @type {(inputs: Developerportal_Components_Imageupload_Clicktoupload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cliquez pour télécharger l'image`)
};

const ar_developerportal_components_imageupload_clicktoupload4 = /** @type {(inputs: Developerportal_Components_Imageupload_Clicktoupload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انقر لرفع الصورة`)
};

/**
* | output |
* | --- |
* | "Click to upload image" |
*
* @param {Developerportal_Components_Imageupload_Clicktoupload4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_imageupload_clicktoupload4 = /** @type {((inputs?: Developerportal_Components_Imageupload_Clicktoupload4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Imageupload_Clicktoupload4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_imageupload_clicktoupload4(inputs)
	if (locale === "es") return es_developerportal_components_imageupload_clicktoupload4(inputs)
	if (locale === "fr") return fr_developerportal_components_imageupload_clicktoupload4(inputs)
	return ar_developerportal_components_imageupload_clicktoupload4(inputs)
});
export { developerportal_components_imageupload_clicktoupload4 as "developerPortal.components.imageUpload.clickToUpload" }