/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Newboost_Experience1Inputs */

const en_boost_newboost_experience1 = /** @type {(inputs: Boost_Newboost_Experience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Experience`)
};

const es_boost_newboost_experience1 = /** @type {(inputs: Boost_Newboost_Experience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva experiencia`)
};

const fr_boost_newboost_experience1 = /** @type {(inputs: Boost_Newboost_Experience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle expérience`)
};

const ar_boost_newboost_experience1 = /** @type {(inputs: Boost_Newboost_Experience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبرة جديدة`)
};

/**
* | output |
* | --- |
* | "New Experience" |
*
* @param {Boost_Newboost_Experience1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newboost_experience1 = /** @type {((inputs?: Boost_Newboost_Experience1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newboost_Experience1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newboost_experience1(inputs)
	if (locale === "es") return es_boost_newboost_experience1(inputs)
	if (locale === "fr") return fr_boost_newboost_experience1(inputs)
	return ar_boost_newboost_experience1(inputs)
});
export { boost_newboost_experience1 as "boost.newBoost.experience" }