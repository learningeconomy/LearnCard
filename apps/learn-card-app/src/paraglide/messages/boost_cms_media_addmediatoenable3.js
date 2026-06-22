/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Addmediatoenable3Inputs */

const en_boost_cms_media_addmediatoenable3 = /** @type {(inputs: Boost_Cms_Media_Addmediatoenable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add media to enable option.`)
};

const es_boost_cms_media_addmediatoenable3 = /** @type {(inputs: Boost_Cms_Media_Addmediatoenable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega medios para habilitar la opción.`)
};

const fr_boost_cms_media_addmediatoenable3 = /** @type {(inputs: Boost_Cms_Media_Addmediatoenable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez des médias pour activer l'option.`)
};

const ar_boost_cms_media_addmediatoenable3 = /** @type {(inputs: Boost_Cms_Media_Addmediatoenable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف وسائط لتمكين الخيار.`)
};

/**
* | output |
* | --- |
* | "Add media to enable option." |
*
* @param {Boost_Cms_Media_Addmediatoenable3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_addmediatoenable3 = /** @type {((inputs?: Boost_Cms_Media_Addmediatoenable3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Addmediatoenable3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_addmediatoenable3(inputs)
	if (locale === "es") return es_boost_cms_media_addmediatoenable3(inputs)
	if (locale === "fr") return fr_boost_cms_media_addmediatoenable3(inputs)
	return ar_boost_cms_media_addmediatoenable3(inputs)
});
export { boost_cms_media_addmediatoenable3 as "boost.cms.media.addMediaToEnable" }