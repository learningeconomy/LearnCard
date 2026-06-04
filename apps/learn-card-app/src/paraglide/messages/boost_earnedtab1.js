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

const de_boost_earnedtab1 = /** @type {(inputs: Boost_Earnedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erhalten`)
};

const ar_boost_earnedtab1 = /** @type {(inputs: Boost_Earnedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المكتسبة`)
};

const fr_boost_earnedtab1 = /** @type {(inputs: Boost_Earnedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenus`)
};

const ko_boost_earnedtab1 = /** @type {(inputs: Boost_Earnedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취득`)
};

/**
* | output |
* | --- |
* | "Earned" |
*
* @param {Boost_Earnedtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_earnedtab1 = /** @type {((inputs?: Boost_Earnedtab1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Earnedtab1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_earnedtab1(inputs)
	if (locale === "es") return es_boost_earnedtab1(inputs)
	if (locale === "de") return de_boost_earnedtab1(inputs)
	if (locale === "ar") return ar_boost_earnedtab1(inputs)
	if (locale === "fr") return fr_boost_earnedtab1(inputs)
	return ko_boost_earnedtab1(inputs)
});
export { boost_earnedtab1 as "boost.earnedTab" }