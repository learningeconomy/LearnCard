/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Addmedia1Inputs */

const en_boost_cms_media_addmedia1 = /** @type {(inputs: Boost_Cms_Media_Addmedia1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Media`)
};

const es_boost_cms_media_addmedia1 = /** @type {(inputs: Boost_Cms_Media_Addmedia1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar medio`)
};

const fr_boost_cms_media_addmedia1 = /** @type {(inputs: Boost_Cms_Media_Addmedia1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un média`)
};

const ar_boost_cms_media_addmedia1 = /** @type {(inputs: Boost_Cms_Media_Addmedia1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة وسائط`)
};

/**
* | output |
* | --- |
* | "Add Media" |
*
* @param {Boost_Cms_Media_Addmedia1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_addmedia1 = /** @type {((inputs?: Boost_Cms_Media_Addmedia1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Addmedia1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_addmedia1(inputs)
	if (locale === "es") return es_boost_cms_media_addmedia1(inputs)
	if (locale === "fr") return fr_boost_cms_media_addmedia1(inputs)
	return ar_boost_cms_media_addmedia1(inputs)
});
export { boost_cms_media_addmedia1 as "boost.cms.media.addMedia" }