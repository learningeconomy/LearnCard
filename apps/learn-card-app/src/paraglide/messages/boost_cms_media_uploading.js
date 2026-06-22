/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_UploadingInputs */

const en_boost_cms_media_uploading = /** @type {(inputs: Boost_Cms_Media_UploadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploading...`)
};

const es_boost_cms_media_uploading = /** @type {(inputs: Boost_Cms_Media_UploadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subiendo...`)
};

const fr_boost_cms_media_uploading = /** @type {(inputs: Boost_Cms_Media_UploadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargement...`)
};

const ar_boost_cms_media_uploading = /** @type {(inputs: Boost_Cms_Media_UploadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحميل...`)
};

/**
* | output |
* | --- |
* | "Uploading..." |
*
* @param {Boost_Cms_Media_UploadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_uploading = /** @type {((inputs?: Boost_Cms_Media_UploadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_UploadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_uploading(inputs)
	if (locale === "es") return es_boost_cms_media_uploading(inputs)
	if (locale === "fr") return fr_boost_cms_media_uploading(inputs)
	return ar_boost_cms_media_uploading(inputs)
});
export { boost_cms_media_uploading as "boost.cms.media.uploading" }