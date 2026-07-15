/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_BoostInputs */

const en_boost_boost = /** @type {(inputs: Boost_BoostInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const es_boost_boost = /** @type {(inputs: Boost_BoostInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const fr_boost_boost = /** @type {(inputs: Boost_BoostInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const ar_boost_boost = /** @type {(inputs: Boost_BoostInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعزيز`)
};

/**
* | output |
* | --- |
* | "Boost" |
*
* @param {Boost_BoostInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_boost = /** @type {((inputs?: Boost_BoostInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_BoostInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_boost(inputs)
	if (locale === "es") return es_boost_boost(inputs)
	if (locale === "fr") return fr_boost_boost(inputs)
	return ar_boost_boost(inputs)
});
export { boost_boost as "boost.boost" }