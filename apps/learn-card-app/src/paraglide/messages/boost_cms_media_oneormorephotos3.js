/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Oneormorephotos3Inputs */

const en_boost_cms_media_oneormorephotos3 = /** @type {(inputs: Boost_Cms_Media_Oneormorephotos3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`One or more photos`)
};

const es_boost_cms_media_oneormorephotos3 = /** @type {(inputs: Boost_Cms_Media_Oneormorephotos3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una o más fotos`)
};

const fr_boost_cms_media_oneormorephotos3 = /** @type {(inputs: Boost_Cms_Media_Oneormorephotos3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une ou plusieurs photos`)
};

const ar_boost_cms_media_oneormorephotos3 = /** @type {(inputs: Boost_Cms_Media_Oneormorephotos3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة واحدة أو أكثر`)
};

/**
* | output |
* | --- |
* | "One or more photos" |
*
* @param {Boost_Cms_Media_Oneormorephotos3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_oneormorephotos3 = /** @type {((inputs?: Boost_Cms_Media_Oneormorephotos3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Oneormorephotos3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_oneormorephotos3(inputs)
	if (locale === "es") return es_boost_cms_media_oneormorephotos3(inputs)
	if (locale === "fr") return fr_boost_cms_media_oneormorephotos3(inputs)
	return ar_boost_cms_media_oneormorephotos3(inputs)
});
export { boost_cms_media_oneormorephotos3 as "boost.cms.media.oneOrMorePhotos" }