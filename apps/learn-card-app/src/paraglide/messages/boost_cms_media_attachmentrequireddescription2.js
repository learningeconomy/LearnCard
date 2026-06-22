/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Attachmentrequireddescription2Inputs */

const en_boost_cms_media_attachmentrequireddescription2 = /** @type {(inputs: Boost_Cms_Media_Attachmentrequireddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This credential uses a media-based display. Please attach a document, image, or link to showcase.`)
};

const es_boost_cms_media_attachmentrequireddescription2 = /** @type {(inputs: Boost_Cms_Media_Attachmentrequireddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta credencial usa una visualización basada en medios. Adjunta un documento, imagen o enlace para mostrar.`)
};

const fr_boost_cms_media_attachmentrequireddescription2 = /** @type {(inputs: Boost_Cms_Media_Attachmentrequireddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette crédential utilise un affichage basé sur les médias. Veuillez joindre un document, une image ou un lien.`)
};

const ar_boost_cms_media_attachmentrequireddescription2 = /** @type {(inputs: Boost_Cms_Media_Attachmentrequireddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستخدم هذا الاعتماد عرضًا قائمًا على الوسائط. يرجى إرفاق مستند أو صورة أو رابط للعرض.`)
};

/**
* | output |
* | --- |
* | "This credential uses a media-based display. Please attach a document, image, or link to showcase." |
*
* @param {Boost_Cms_Media_Attachmentrequireddescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_attachmentrequireddescription2 = /** @type {((inputs?: Boost_Cms_Media_Attachmentrequireddescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Attachmentrequireddescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_attachmentrequireddescription2(inputs)
	if (locale === "es") return es_boost_cms_media_attachmentrequireddescription2(inputs)
	if (locale === "fr") return fr_boost_cms_media_attachmentrequireddescription2(inputs)
	return ar_boost_cms_media_attachmentrequireddescription2(inputs)
});
export { boost_cms_media_attachmentrequireddescription2 as "boost.cms.media.attachmentRequiredDescription" }