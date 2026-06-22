/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Pastelink1Inputs */

const en_boost_cms_media_pastelink1 = /** @type {(inputs: Boost_Cms_Media_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste link...`)
};

const es_boost_cms_media_pastelink1 = /** @type {(inputs: Boost_Cms_Media_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pegar enlace...`)
};

const fr_boost_cms_media_pastelink1 = /** @type {(inputs: Boost_Cms_Media_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Coller le lien...`)
};

const ar_boost_cms_media_pastelink1 = /** @type {(inputs: Boost_Cms_Media_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق الرابط...`)
};

/**
* | output |
* | --- |
* | "Paste link..." |
*
* @param {Boost_Cms_Media_Pastelink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_pastelink1 = /** @type {((inputs?: Boost_Cms_Media_Pastelink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Pastelink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_pastelink1(inputs)
	if (locale === "es") return es_boost_cms_media_pastelink1(inputs)
	if (locale === "fr") return fr_boost_cms_media_pastelink1(inputs)
	return ar_boost_cms_media_pastelink1(inputs)
});
export { boost_cms_media_pastelink1 as "boost.cms.media.pasteLink" }