/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Shortboost_Myself1Inputs */

const en_boost_shortboost_myself1 = /** @type {(inputs: Boost_Shortboost_Myself1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Myself`)
};

const es_boost_shortboost_myself1 = /** @type {(inputs: Boost_Shortboost_Myself1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yo mismo`)
};

const fr_boost_shortboost_myself1 = /** @type {(inputs: Boost_Shortboost_Myself1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Moi-même`)
};

const ar_boost_shortboost_myself1 = /** @type {(inputs: Boost_Shortboost_Myself1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا`)
};

/**
* | output |
* | --- |
* | "Myself" |
*
* @param {Boost_Shortboost_Myself1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_shortboost_myself1 = /** @type {((inputs?: Boost_Shortboost_Myself1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Shortboost_Myself1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_shortboost_myself1(inputs)
	if (locale === "es") return es_boost_shortboost_myself1(inputs)
	if (locale === "fr") return fr_boost_shortboost_myself1(inputs)
	return ar_boost_shortboost_myself1(inputs)
});
export { boost_shortboost_myself1 as "boost.shortBoost.myself" }