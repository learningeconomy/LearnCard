/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Requiredformediadisplay3Inputs */

const en_boost_cms_media_requiredformediadisplay3 = /** @type {(inputs: Boost_Cms_Media_Requiredformediadisplay3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Required for Media Display type.`)
};

const es_boost_cms_media_requiredformediadisplay3 = /** @type {(inputs: Boost_Cms_Media_Requiredformediadisplay3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requerido para el tipo de visualización de medios.`)
};

const fr_boost_cms_media_requiredformediadisplay3 = /** @type {(inputs: Boost_Cms_Media_Requiredformediadisplay3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requis pour le type d'affichage Média.`)
};

const ar_boost_cms_media_requiredformediadisplay3 = /** @type {(inputs: Boost_Cms_Media_Requiredformediadisplay3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب لنوع عرض الوسائط.`)
};

/**
* | output |
* | --- |
* | "Required for Media Display type." |
*
* @param {Boost_Cms_Media_Requiredformediadisplay3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_requiredformediadisplay3 = /** @type {((inputs?: Boost_Cms_Media_Requiredformediadisplay3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Requiredformediadisplay3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_requiredformediadisplay3(inputs)
	if (locale === "es") return es_boost_cms_media_requiredformediadisplay3(inputs)
	if (locale === "fr") return fr_boost_cms_media_requiredformediadisplay3(inputs)
	return ar_boost_cms_media_requiredformediadisplay3(inputs)
});
export { boost_cms_media_requiredformediadisplay3 as "boost.cms.media.requiredForMediaDisplay" }