/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ percent: NonNullable<unknown> }} Boost_Cms_Media_Uploadedpercent1Inputs */

const en_boost_cms_media_uploadedpercent1 = /** @type {(inputs: Boost_Cms_Media_Uploadedpercent1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% uploaded`)
};

const es_boost_cms_media_uploadedpercent1 = /** @type {(inputs: Boost_Cms_Media_Uploadedpercent1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% cargado`)
};

const fr_boost_cms_media_uploadedpercent1 = /** @type {(inputs: Boost_Cms_Media_Uploadedpercent1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% téléchargé`)
};

const ar_boost_cms_media_uploadedpercent1 = /** @type {(inputs: Boost_Cms_Media_Uploadedpercent1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% تم التحميل`)
};

/**
* | output |
* | --- |
* | "{percent}% uploaded" |
*
* @param {Boost_Cms_Media_Uploadedpercent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_uploadedpercent1 = /** @type {((inputs: Boost_Cms_Media_Uploadedpercent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Uploadedpercent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_uploadedpercent1(inputs)
	if (locale === "es") return es_boost_cms_media_uploadedpercent1(inputs)
	if (locale === "fr") return fr_boost_cms_media_uploadedpercent1(inputs)
	return ar_boost_cms_media_uploadedpercent1(inputs)
});
export { boost_cms_media_uploadedpercent1 as "boost.cms.media.uploadedPercent" }