/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Preview_IdInputs */

const en_boost_cms_preview_id = /** @type {(inputs: Boost_Cms_Preview_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID`)
};

const es_boost_cms_preview_id = /** @type {(inputs: Boost_Cms_Preview_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID`)
};

const fr_boost_cms_preview_id = /** @type {(inputs: Boost_Cms_Preview_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID`)
};

const ar_boost_cms_preview_id = /** @type {(inputs: Boost_Cms_Preview_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف`)
};

/**
* | output |
* | --- |
* | "ID" |
*
* @param {Boost_Cms_Preview_IdInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_preview_id = /** @type {((inputs?: Boost_Cms_Preview_IdInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Preview_IdInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_preview_id(inputs)
	if (locale === "es") return es_boost_cms_preview_id(inputs)
	if (locale === "fr") return fr_boost_cms_preview_id(inputs)
	return ar_boost_cms_preview_id(inputs)
});
export { boost_cms_preview_id as "boost.cms.preview.id" }