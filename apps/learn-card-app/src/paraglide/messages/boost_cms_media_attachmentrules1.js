/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Attachmentrules1Inputs */

const en_boost_cms_media_attachmentrules1 = /** @type {(inputs: Boost_Cms_Media_Attachmentrules1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Media Attachment Rules`)
};

const es_boost_cms_media_attachmentrules1 = /** @type {(inputs: Boost_Cms_Media_Attachmentrules1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reglas de adjuntos de medios`)
};

const fr_boost_cms_media_attachmentrules1 = /** @type {(inputs: Boost_Cms_Media_Attachmentrules1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Règles des pièces jointes`)
};

const ar_boost_cms_media_attachmentrules1 = /** @type {(inputs: Boost_Cms_Media_Attachmentrules1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قواعد مرفقات الوسائط`)
};

/**
* | output |
* | --- |
* | "Media Attachment Rules" |
*
* @param {Boost_Cms_Media_Attachmentrules1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_attachmentrules1 = /** @type {((inputs?: Boost_Cms_Media_Attachmentrules1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Attachmentrules1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_attachmentrules1(inputs)
	if (locale === "es") return es_boost_cms_media_attachmentrules1(inputs)
	if (locale === "fr") return fr_boost_cms_media_attachmentrules1(inputs)
	return ar_boost_cms_media_attachmentrules1(inputs)
});
export { boost_cms_media_attachmentrules1 as "boost.cms.media.attachmentRules" }