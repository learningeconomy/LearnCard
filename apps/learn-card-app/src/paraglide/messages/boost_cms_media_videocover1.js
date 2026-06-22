/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Videocover1Inputs */

const en_boost_cms_media_videocover1 = /** @type {(inputs: Boost_Cms_Media_Videocover1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Video Cover`)
};

const es_boost_cms_media_videocover1 = /** @type {(inputs: Boost_Cms_Media_Videocover1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portada del video`)
};

const fr_boost_cms_media_videocover1 = /** @type {(inputs: Boost_Cms_Media_Videocover1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couverture vidéo`)
};

const ar_boost_cms_media_videocover1 = /** @type {(inputs: Boost_Cms_Media_Videocover1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غلاف الفيديو`)
};

/**
* | output |
* | --- |
* | "Video Cover" |
*
* @param {Boost_Cms_Media_Videocover1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_videocover1 = /** @type {((inputs?: Boost_Cms_Media_Videocover1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Videocover1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_videocover1(inputs)
	if (locale === "es") return es_boost_cms_media_videocover1(inputs)
	if (locale === "fr") return fr_boost_cms_media_videocover1(inputs)
	return ar_boost_cms_media_videocover1(inputs)
});
export { boost_cms_media_videocover1 as "boost.cms.media.videoCover" }