/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Attachmentrulesdescription2Inputs */

const en_boost_cms_media_attachmentrulesdescription2 = /** @type {(inputs: Boost_Cms_Media_Attachmentrulesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can attach only one media type per credential:`)
};

const es_boost_cms_media_attachmentrulesdescription2 = /** @type {(inputs: Boost_Cms_Media_Attachmentrulesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puedes adjuntar solo un tipo de medio por credencial:`)
};

const fr_boost_cms_media_attachmentrulesdescription2 = /** @type {(inputs: Boost_Cms_Media_Attachmentrulesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous ne pouvez joindre qu'un seul type de média par crédential :`)
};

const ar_boost_cms_media_attachmentrulesdescription2 = /** @type {(inputs: Boost_Cms_Media_Attachmentrulesdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكنك إرفاق نوع وسائط واحد فقط لكل اعتماد:`)
};

/**
* | output |
* | --- |
* | "You can attach only one media type per credential:" |
*
* @param {Boost_Cms_Media_Attachmentrulesdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_attachmentrulesdescription2 = /** @type {((inputs?: Boost_Cms_Media_Attachmentrulesdescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Attachmentrulesdescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_attachmentrulesdescription2(inputs)
	if (locale === "es") return es_boost_cms_media_attachmentrulesdescription2(inputs)
	if (locale === "fr") return fr_boost_cms_media_attachmentrulesdescription2(inputs)
	return ar_boost_cms_media_attachmentrulesdescription2(inputs)
});
export { boost_cms_media_attachmentrulesdescription2 as "boost.cms.media.attachmentRulesDescription" }