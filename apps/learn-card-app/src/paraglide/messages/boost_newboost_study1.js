/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Newboost_Study1Inputs */

const en_boost_newboost_study1 = /** @type {(inputs: Boost_Newboost_Study1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Study`)
};

const es_boost_newboost_study1 = /** @type {(inputs: Boost_Newboost_Study1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo estudio`)
};

const fr_boost_newboost_study1 = /** @type {(inputs: Boost_Newboost_Study1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle formation`)
};

const ar_boost_newboost_study1 = /** @type {(inputs: Boost_Newboost_Study1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دراسة جديدة`)
};

/**
* | output |
* | --- |
* | "New Study" |
*
* @param {Boost_Newboost_Study1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newboost_study1 = /** @type {((inputs?: Boost_Newboost_Study1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newboost_Study1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newboost_study1(inputs)
	if (locale === "es") return es_boost_newboost_study1(inputs)
	if (locale === "fr") return fr_boost_newboost_study1(inputs)
	return ar_boost_newboost_study1(inputs)
});
export { boost_newboost_study1 as "boost.newBoost.study" }