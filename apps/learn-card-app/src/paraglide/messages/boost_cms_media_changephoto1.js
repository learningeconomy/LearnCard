/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Changephoto1Inputs */

const en_boost_cms_media_changephoto1 = /** @type {(inputs: Boost_Cms_Media_Changephoto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change Photo`)
};

const es_boost_cms_media_changephoto1 = /** @type {(inputs: Boost_Cms_Media_Changephoto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar foto`)
};

const fr_boost_cms_media_changephoto1 = /** @type {(inputs: Boost_Cms_Media_Changephoto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer la photo`)
};

const ar_boost_cms_media_changephoto1 = /** @type {(inputs: Boost_Cms_Media_Changephoto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير الصورة`)
};

/**
* | output |
* | --- |
* | "Change Photo" |
*
* @param {Boost_Cms_Media_Changephoto1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_changephoto1 = /** @type {((inputs?: Boost_Cms_Media_Changephoto1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Changephoto1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_changephoto1(inputs)
	if (locale === "es") return es_boost_cms_media_changephoto1(inputs)
	if (locale === "fr") return fr_boost_cms_media_changephoto1(inputs)
	return ar_boost_cms_media_changephoto1(inputs)
});
export { boost_cms_media_changephoto1 as "boost.cms.media.changePhoto" }