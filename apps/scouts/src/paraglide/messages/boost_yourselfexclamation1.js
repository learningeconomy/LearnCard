/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Yourselfexclamation1Inputs */

const en_boost_yourselfexclamation1 = /** @type {(inputs: Boost_Yourselfexclamation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yourself!`)
};

const es_boost_yourselfexclamation1 = /** @type {(inputs: Boost_Yourselfexclamation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Tú Mismo!`)
};

const fr_boost_yourselfexclamation1 = /** @type {(inputs: Boost_Yourselfexclamation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous-même !`)
};

const ar_boost_yourselfexclamation1 = /** @type {(inputs: Boost_Yourselfexclamation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yourself!`)
};

/**
* | output |
* | --- |
* | "Yourself!" |
*
* @param {Boost_Yourselfexclamation1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_yourselfexclamation1 = /** @type {((inputs?: Boost_Yourselfexclamation1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Yourselfexclamation1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_yourselfexclamation1(inputs)
	if (locale === "es") return es_boost_yourselfexclamation1(inputs)
	if (locale === "fr") return fr_boost_yourselfexclamation1(inputs)
	return ar_boost_yourselfexclamation1(inputs)
});
export { boost_yourselfexclamation1 as "boost.yourselfExclamation" }