/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Newboost_Achievement1Inputs */

const en_boost_newboost_achievement1 = /** @type {(inputs: Boost_Newboost_Achievement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Achievement`)
};

const es_boost_newboost_achievement1 = /** @type {(inputs: Boost_Newboost_Achievement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo logro`)
};

const fr_boost_newboost_achievement1 = /** @type {(inputs: Boost_Newboost_Achievement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle réalisation`)
};

const ar_boost_newboost_achievement1 = /** @type {(inputs: Boost_Newboost_Achievement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنجاز جديد`)
};

/**
* | output |
* | --- |
* | "New Achievement" |
*
* @param {Boost_Newboost_Achievement1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newboost_achievement1 = /** @type {((inputs?: Boost_Newboost_Achievement1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newboost_Achievement1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newboost_achievement1(inputs)
	if (locale === "es") return es_boost_newboost_achievement1(inputs)
	if (locale === "fr") return fr_boost_newboost_achievement1(inputs)
	return ar_boost_newboost_achievement1(inputs)
});
export { boost_newboost_achievement1 as "boost.newBoost.achievement" }