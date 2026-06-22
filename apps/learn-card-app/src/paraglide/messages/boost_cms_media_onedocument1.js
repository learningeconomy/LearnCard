/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Onedocument1Inputs */

const en_boost_cms_media_onedocument1 = /** @type {(inputs: Boost_Cms_Media_Onedocument1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`One document`)
};

const es_boost_cms_media_onedocument1 = /** @type {(inputs: Boost_Cms_Media_Onedocument1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un documento`)
};

const fr_boost_cms_media_onedocument1 = /** @type {(inputs: Boost_Cms_Media_Onedocument1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un document`)
};

const ar_boost_cms_media_onedocument1 = /** @type {(inputs: Boost_Cms_Media_Onedocument1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستند واحد`)
};

/**
* | output |
* | --- |
* | "One document" |
*
* @param {Boost_Cms_Media_Onedocument1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_onedocument1 = /** @type {((inputs?: Boost_Cms_Media_Onedocument1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Onedocument1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_onedocument1(inputs)
	if (locale === "es") return es_boost_cms_media_onedocument1(inputs)
	if (locale === "fr") return fr_boost_cms_media_onedocument1(inputs)
	return ar_boost_cms_media_onedocument1(inputs)
});
export { boost_cms_media_onedocument1 as "boost.cms.media.oneDocument" }