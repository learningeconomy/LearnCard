/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Selectmediatype2Inputs */

const en_boost_cms_media_selectmediatype2 = /** @type {(inputs: Boost_Cms_Media_Selectmediatype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Media Type`)
};

const es_boost_cms_media_selectmediatype2 = /** @type {(inputs: Boost_Cms_Media_Selectmediatype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar tipo de medio`)
};

const fr_boost_cms_media_selectmediatype2 = /** @type {(inputs: Boost_Cms_Media_Selectmediatype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le type de média`)
};

const ar_boost_cms_media_selectmediatype2 = /** @type {(inputs: Boost_Cms_Media_Selectmediatype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديد نوع الوسائط`)
};

/**
* | output |
* | --- |
* | "Select Media Type" |
*
* @param {Boost_Cms_Media_Selectmediatype2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_selectmediatype2 = /** @type {((inputs?: Boost_Cms_Media_Selectmediatype2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Selectmediatype2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_selectmediatype2(inputs)
	if (locale === "es") return es_boost_cms_media_selectmediatype2(inputs)
	if (locale === "fr") return fr_boost_cms_media_selectmediatype2(inputs)
	return ar_boost_cms_media_selectmediatype2(inputs)
});
export { boost_cms_media_selectmediatype2 as "boost.cms.media.selectMediaType" }