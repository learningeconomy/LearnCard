/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Earnedtab1Inputs */

const en_boost_earnedtab1 = /** @type {(inputs: Boost_Earnedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Earned`)
};

const es_boost_earnedtab1 = /** @type {(inputs: Boost_Earnedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenidos`)
};

const fr_boost_earnedtab1 = /** @type {(inputs: Boost_Earnedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenus`)
};

const ar_boost_earnedtab1 = /** @type {(inputs: Boost_Earnedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المكتسبة`)
};

/**
* | output |
* | --- |
* | "Earned" |
*
* @param {Boost_Earnedtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_earnedtab1 = /** @type {((inputs?: Boost_Earnedtab1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Earnedtab1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_earnedtab1(inputs)
	if (locale === "es") return es_boost_earnedtab1(inputs)
	if (locale === "fr") return fr_boost_earnedtab1(inputs)
	return ar_boost_earnedtab1(inputs)
});
export { boost_earnedtab1 as "boost.earnedTab" }