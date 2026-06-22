/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Loading_CreatingInputs */

const en_boost_cms_loading_creating = /** @type {(inputs: Boost_Cms_Loading_CreatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating boost...`)
};

const es_boost_cms_loading_creating = /** @type {(inputs: Boost_Cms_Loading_CreatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando Boost...`)
};

const fr_boost_cms_loading_creating = /** @type {(inputs: Boost_Cms_Loading_CreatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création du Boost...`)
};

const ar_boost_cms_loading_creating = /** @type {(inputs: Boost_Cms_Loading_CreatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إنشاء Boost...`)
};

/**
* | output |
* | --- |
* | "Creating boost..." |
*
* @param {Boost_Cms_Loading_CreatingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_loading_creating = /** @type {((inputs?: Boost_Cms_Loading_CreatingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Loading_CreatingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_loading_creating(inputs)
	if (locale === "es") return es_boost_cms_loading_creating(inputs)
	if (locale === "fr") return fr_boost_cms_loading_creating(inputs)
	return ar_boost_cms_loading_creating(inputs)
});
export { boost_cms_loading_creating as "boost.cms.loading.creating" }