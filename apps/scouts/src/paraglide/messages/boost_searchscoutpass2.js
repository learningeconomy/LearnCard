/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Searchscoutpass2Inputs */

const en_boost_searchscoutpass2 = /** @type {(inputs: Boost_Searchscoutpass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search ScoutPass Network...`)
};

const es_boost_searchscoutpass2 = /** @type {(inputs: Boost_Searchscoutpass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar en la Red ScoutPass...`)
};

const fr_boost_searchscoutpass2 = /** @type {(inputs: Boost_Searchscoutpass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher sur le réseau ScoutPass...`)
};

const ar_boost_searchscoutpass2 = /** @type {(inputs: Boost_Searchscoutpass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search ScoutPass Network...`)
};

/**
* | output |
* | --- |
* | "Search ScoutPass Network..." |
*
* @param {Boost_Searchscoutpass2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_searchscoutpass2 = /** @type {((inputs?: Boost_Searchscoutpass2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Searchscoutpass2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_searchscoutpass2(inputs)
	if (locale === "es") return es_boost_searchscoutpass2(inputs)
	if (locale === "fr") return fr_boost_searchscoutpass2(inputs)
	return ar_boost_searchscoutpass2(inputs)
});
export { boost_searchscoutpass2 as "boost.searchScoutPass" }