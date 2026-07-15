/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Boost_Searchtroop1Inputs */

const en_boost_searchtroop1 = /** @type {(inputs: Boost_Searchtroop1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Search ${i?.name}...`)
};

const es_boost_searchtroop1 = /** @type {(inputs: Boost_Searchtroop1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Buscar ${i?.name}...`)
};

const fr_boost_searchtroop1 = /** @type {(inputs: Boost_Searchtroop1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rechercher ${i?.name}...`)
};

const ar_boost_searchtroop1 = /** @type {(inputs: Boost_Searchtroop1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`بحث في ${i?.name}...`)
};

/**
* | output |
* | --- |
* | "Search {name}..." |
*
* @param {Boost_Searchtroop1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_searchtroop1 = /** @type {((inputs: Boost_Searchtroop1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Searchtroop1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_searchtroop1(inputs)
	if (locale === "es") return es_boost_searchtroop1(inputs)
	if (locale === "fr") return fr_boost_searchtroop1(inputs)
	return ar_boost_searchtroop1(inputs)
});
export { boost_searchtroop1 as "boost.searchTroop" }