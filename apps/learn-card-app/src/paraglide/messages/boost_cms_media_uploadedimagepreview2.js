/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Uploadedimagepreview2Inputs */

const en_boost_cms_media_uploadedimagepreview2 = /** @type {(inputs: Boost_Cms_Media_Uploadedimagepreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploaded Image Preview`)
};

const es_boost_cms_media_uploadedimagepreview2 = /** @type {(inputs: Boost_Cms_Media_Uploadedimagepreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa de la imagen cargada`)
};

const fr_boost_cms_media_uploadedimagepreview2 = /** @type {(inputs: Boost_Cms_Media_Uploadedimagepreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu de l'image téléchargée`)
};

const ar_boost_cms_media_uploadedimagepreview2 = /** @type {(inputs: Boost_Cms_Media_Uploadedimagepreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة الصورة المرفوعة`)
};

/**
* | output |
* | --- |
* | "Uploaded Image Preview" |
*
* @param {Boost_Cms_Media_Uploadedimagepreview2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_uploadedimagepreview2 = /** @type {((inputs?: Boost_Cms_Media_Uploadedimagepreview2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Uploadedimagepreview2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_uploadedimagepreview2(inputs)
	if (locale === "es") return es_boost_cms_media_uploadedimagepreview2(inputs)
	if (locale === "fr") return fr_boost_cms_media_uploadedimagepreview2(inputs)
	return ar_boost_cms_media_uploadedimagepreview2(inputs)
});
export { boost_cms_media_uploadedimagepreview2 as "boost.cms.media.uploadedImagePreview" }