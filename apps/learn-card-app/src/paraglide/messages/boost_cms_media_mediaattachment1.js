/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Mediaattachment1Inputs */

const en_boost_cms_media_mediaattachment1 = /** @type {(inputs: Boost_Cms_Media_Mediaattachment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Media Attachment`)
};

const es_boost_cms_media_mediaattachment1 = /** @type {(inputs: Boost_Cms_Media_Mediaattachment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adjunto de medios`)
};

const fr_boost_cms_media_mediaattachment1 = /** @type {(inputs: Boost_Cms_Media_Mediaattachment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pièce jointe média`)
};

const ar_boost_cms_media_mediaattachment1 = /** @type {(inputs: Boost_Cms_Media_Mediaattachment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرفق وسائط`)
};

/**
* | output |
* | --- |
* | "Media Attachment" |
*
* @param {Boost_Cms_Media_Mediaattachment1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_mediaattachment1 = /** @type {((inputs?: Boost_Cms_Media_Mediaattachment1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Mediaattachment1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_mediaattachment1(inputs)
	if (locale === "es") return es_boost_cms_media_mediaattachment1(inputs)
	if (locale === "fr") return fr_boost_cms_media_mediaattachment1(inputs)
	return ar_boost_cms_media_mediaattachment1(inputs)
});
export { boost_cms_media_mediaattachment1 as "boost.cms.media.mediaAttachment" }