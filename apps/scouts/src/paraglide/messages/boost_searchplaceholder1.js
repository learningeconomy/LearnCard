/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Searchplaceholder1Inputs */

const en_boost_searchplaceholder1 = /** @type {(inputs: Boost_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search...`)
};

const es_boost_searchplaceholder1 = /** @type {(inputs: Boost_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar...`)
};

const fr_boost_searchplaceholder1 = /** @type {(inputs: Boost_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher...`)
};

const ar_boost_searchplaceholder1 = /** @type {(inputs: Boost_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search...`)
};

/**
* | output |
* | --- |
* | "Search..." |
*
* @param {Boost_Searchplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_searchplaceholder1 = /** @type {((inputs?: Boost_Searchplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Searchplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_searchplaceholder1(inputs)
	if (locale === "es") return es_boost_searchplaceholder1(inputs)
	if (locale === "fr") return fr_boost_searchplaceholder1(inputs)
	return ar_boost_searchplaceholder1(inputs)
});
export { boost_searchplaceholder1 as "boost.searchPlaceholder" }