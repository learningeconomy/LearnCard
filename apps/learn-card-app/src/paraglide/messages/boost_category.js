/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_CategoryInputs */

const en_boost_category = /** @type {(inputs: Boost_CategoryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Category`)
};

const es_boost_category = /** @type {(inputs: Boost_CategoryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Categoría`)
};

const fr_boost_category = /** @type {(inputs: Boost_CategoryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Catégorie`)
};

const ar_boost_category = /** @type {(inputs: Boost_CategoryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الفئة`)
};

/**
* | output |
* | --- |
* | "Category" |
*
* @param {Boost_CategoryInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_category = /** @type {((inputs?: Boost_CategoryInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_CategoryInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_category(inputs)
	if (locale === "es") return es_boost_category(inputs)
	if (locale === "fr") return fr_boost_category(inputs)
	return ar_boost_category(inputs)
});
export { boost_category as "boost.category" }