/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Mixingnotallowed2Inputs */

const en_boost_cms_media_mixingnotallowed2 = /** @type {(inputs: Boost_Cms_Media_Mixingnotallowed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mixing types (like photo + video) isn't allowed.`)
};

const es_boost_cms_media_mixingnotallowed2 = /** @type {(inputs: Boost_Cms_Media_Mixingnotallowed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se permite mezclar tipos (como foto + video).`)
};

const fr_boost_cms_media_mixingnotallowed2 = /** @type {(inputs: Boost_Cms_Media_Mixingnotallowed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le mélange de types (comme photo + vidéo) n'est pas autorisé.`)
};

const ar_boost_cms_media_mixingnotallowed2 = /** @type {(inputs: Boost_Cms_Media_Mixingnotallowed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يُسمح بخلط الأنواع (مثل صورة + فيديو).`)
};

/**
* | output |
* | --- |
* | "Mixing types (like photo + video) isn't allowed." |
*
* @param {Boost_Cms_Media_Mixingnotallowed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_mixingnotallowed2 = /** @type {((inputs?: Boost_Cms_Media_Mixingnotallowed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Mixingnotallowed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_mixingnotallowed2(inputs)
	if (locale === "es") return es_boost_cms_media_mixingnotallowed2(inputs)
	if (locale === "fr") return fr_boost_cms_media_mixingnotallowed2(inputs)
	return ar_boost_cms_media_mixingnotallowed2(inputs)
});
export { boost_cms_media_mixingnotallowed2 as "boost.cms.media.mixingNotAllowed" }