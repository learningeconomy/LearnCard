/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Loading_PublishingInputs */

const en_boost_cms_loading_publishing = /** @type {(inputs: Boost_Cms_Loading_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publishing boost...`)
};

const es_boost_cms_loading_publishing = /** @type {(inputs: Boost_Cms_Loading_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicando Boost...`)
};

const fr_boost_cms_loading_publishing = /** @type {(inputs: Boost_Cms_Loading_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publication du Boost...`)
};

const ar_boost_cms_loading_publishing = /** @type {(inputs: Boost_Cms_Loading_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ نشر Boost...`)
};

/**
* | output |
* | --- |
* | "Publishing boost..." |
*
* @param {Boost_Cms_Loading_PublishingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_loading_publishing = /** @type {((inputs?: Boost_Cms_Loading_PublishingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Loading_PublishingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_loading_publishing(inputs)
	if (locale === "es") return es_boost_cms_loading_publishing(inputs)
	if (locale === "fr") return fr_boost_cms_loading_publishing(inputs)
	return ar_boost_cms_loading_publishing(inputs)
});
export { boost_cms_loading_publishing as "boost.cms.loading.publishing" }