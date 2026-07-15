/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_TroopInputs */

const en_boost_troop = /** @type {(inputs: Boost_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop`)
};

const es_boost_troop = /** @type {(inputs: Boost_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop`)
};

const fr_boost_troop = /** @type {(inputs: Boost_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troupe`)
};

const ar_boost_troop = /** @type {(inputs: Boost_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فرقة`)
};

/**
* | output |
* | --- |
* | "Troop" |
*
* @param {Boost_TroopInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_troop = /** @type {((inputs?: Boost_TroopInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_TroopInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_troop(inputs)
	if (locale === "es") return es_boost_troop(inputs)
	if (locale === "fr") return fr_boost_troop(inputs)
	return ar_boost_troop(inputs)
});
export { boost_troop as "boost.troop" }