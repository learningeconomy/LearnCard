/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Searchboosts1Inputs */

const en_boost_searchboosts1 = /** @type {(inputs: Boost_Searchboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search boosts...`)
};

const es_boost_searchboosts1 = /** @type {(inputs: Boost_Searchboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar boosts...`)
};

const de_boost_searchboosts1 = /** @type {(inputs: Boost_Searchboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts suchen...`)
};

const ar_boost_searchboosts1 = /** @type {(inputs: Boost_Searchboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث عن ترقيات...`)
};

const fr_boost_searchboosts1 = /** @type {(inputs: Boost_Searchboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des boosts...`)
};

const ko_boost_searchboosts1 = /** @type {(inputs: Boost_Searchboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트 검색...`)
};

/**
* | output |
* | --- |
* | "Search boosts..." |
*
* @param {Boost_Searchboosts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_searchboosts1 = /** @type {((inputs?: Boost_Searchboosts1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Searchboosts1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_searchboosts1(inputs)
	if (locale === "es") return es_boost_searchboosts1(inputs)
	if (locale === "de") return de_boost_searchboosts1(inputs)
	if (locale === "ar") return ar_boost_searchboosts1(inputs)
	if (locale === "fr") return fr_boost_searchboosts1(inputs)
	return ko_boost_searchboosts1(inputs)
});
export { boost_searchboosts1 as "boost.searchBoosts" }