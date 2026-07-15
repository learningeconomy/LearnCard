/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Somethingwentwrong2Inputs */

const en_boost_somethingwentwrong2 = /** @type {(inputs: Boost_Somethingwentwrong2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong`)
};

const es_boost_somethingwentwrong2 = /** @type {(inputs: Boost_Somethingwentwrong2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algo salió mal`)
};

const fr_boost_somethingwentwrong2 = /** @type {(inputs: Boost_Somethingwentwrong2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue`)
};

const ar_boost_somethingwentwrong2 = /** @type {(inputs: Boost_Somethingwentwrong2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما`)
};

/**
* | output |
* | --- |
* | "Something went wrong" |
*
* @param {Boost_Somethingwentwrong2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_somethingwentwrong2 = /** @type {((inputs?: Boost_Somethingwentwrong2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Somethingwentwrong2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_somethingwentwrong2(inputs)
	if (locale === "es") return es_boost_somethingwentwrong2(inputs)
	if (locale === "fr") return fr_boost_somethingwentwrong2(inputs)
	return ar_boost_somethingwentwrong2(inputs)
});
export { boost_somethingwentwrong2 as "boost.somethingWentWrong" }