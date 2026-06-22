/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Mediaattachments1Inputs */

const en_boost_cms_media_mediaattachments1 = /** @type {(inputs: Boost_Cms_Media_Mediaattachments1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Media Attachments`)
};

const es_boost_cms_media_mediaattachments1 = /** @type {(inputs: Boost_Cms_Media_Mediaattachments1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivos adjuntos`)
};

const fr_boost_cms_media_mediaattachments1 = /** @type {(inputs: Boost_Cms_Media_Mediaattachments1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pièces jointes`)
};

const ar_boost_cms_media_mediaattachments1 = /** @type {(inputs: Boost_Cms_Media_Mediaattachments1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرفقات الوسائط`)
};

/**
* | output |
* | --- |
* | "Media Attachments" |
*
* @param {Boost_Cms_Media_Mediaattachments1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_mediaattachments1 = /** @type {((inputs?: Boost_Cms_Media_Mediaattachments1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Mediaattachments1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_mediaattachments1(inputs)
	if (locale === "es") return es_boost_cms_media_mediaattachments1(inputs)
	if (locale === "fr") return fr_boost_cms_media_mediaattachments1(inputs)
	return ar_boost_cms_media_mediaattachments1(inputs)
});
export { boost_cms_media_mediaattachments1 as "boost.cms.media.mediaAttachments" }