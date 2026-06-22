/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Newboost_Boost1Inputs */

const en_boost_newboost_boost1 = /** @type {(inputs: Boost_Newboost_Boost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Boost`)
};

const es_boost_newboost_boost1 = /** @type {(inputs: Boost_Newboost_Boost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo boost`)
};

const fr_boost_newboost_boost1 = /** @type {(inputs: Boost_Newboost_Boost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau boost`)
};

const ar_boost_newboost_boost1 = /** @type {(inputs: Boost_Newboost_Boost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعزيز جديد`)
};

/**
* | output |
* | --- |
* | "New Boost" |
*
* @param {Boost_Newboost_Boost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newboost_boost1 = /** @type {((inputs?: Boost_Newboost_Boost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newboost_Boost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newboost_boost1(inputs)
	if (locale === "es") return es_boost_newboost_boost1(inputs)
	if (locale === "fr") return fr_boost_newboost_boost1(inputs)
	return ar_boost_newboost_boost1(inputs)
});
export { boost_newboost_boost1 as "boost.newBoost.boost" }