/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Loading_LoadingInputs */

const en_boost_cms_loading_loading = /** @type {(inputs: Boost_Cms_Loading_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading boost...`)
};

const es_boost_cms_loading_loading = /** @type {(inputs: Boost_Cms_Loading_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando Boost...`)
};

const fr_boost_cms_loading_loading = /** @type {(inputs: Boost_Cms_Loading_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement du Boost...`)
};

const ar_boost_cms_loading_loading = /** @type {(inputs: Boost_Cms_Loading_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل Boost...`)
};

/**
* | output |
* | --- |
* | "Loading boost..." |
*
* @param {Boost_Cms_Loading_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_loading_loading = /** @type {((inputs?: Boost_Cms_Loading_LoadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Loading_LoadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_loading_loading(inputs)
	if (locale === "es") return es_boost_cms_loading_loading(inputs)
	if (locale === "fr") return fr_boost_cms_loading_loading(inputs)
	return ar_boost_cms_loading_loading(inputs)
});
export { boost_cms_loading_loading as "boost.cms.loading.loading" }