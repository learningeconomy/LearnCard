/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Loading_IssuingInputs */

const en_boost_cms_loading_issuing = /** @type {(inputs: Boost_Cms_Loading_IssuingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuing boost...`)
};

const es_boost_cms_loading_issuing = /** @type {(inputs: Boost_Cms_Loading_IssuingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitiendo Boost...`)
};

const fr_boost_cms_loading_issuing = /** @type {(inputs: Boost_Cms_Loading_IssuingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émission du Boost...`)
};

const ar_boost_cms_loading_issuing = /** @type {(inputs: Boost_Cms_Loading_IssuingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إصدار Boost...`)
};

/**
* | output |
* | --- |
* | "Issuing boost..." |
*
* @param {Boost_Cms_Loading_IssuingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_loading_issuing = /** @type {((inputs?: Boost_Cms_Loading_IssuingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Loading_IssuingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_loading_issuing(inputs)
	if (locale === "es") return es_boost_cms_loading_issuing(inputs)
	if (locale === "fr") return fr_boost_cms_loading_issuing(inputs)
	return ar_boost_cms_loading_issuing(inputs)
});
export { boost_cms_loading_issuing as "boost.cms.loading.issuing" }