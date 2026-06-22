/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ type: NonNullable<unknown> }} Boost_Newboost_Generic1Inputs */

const en_boost_newboost_generic1 = /** @type {(inputs: Boost_Newboost_Generic1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`New ${i?.type}`)
};

const es_boost_newboost_generic1 = /** @type {(inputs: Boost_Newboost_Generic1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nuevo ${i?.type}`)
};

const fr_boost_newboost_generic1 = /** @type {(inputs: Boost_Newboost_Generic1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nouveau ${i?.type}`)
};

const ar_boost_newboost_generic1 = /** @type {(inputs: Boost_Newboost_Generic1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.type} جديد`)
};

/**
* | output |
* | --- |
* | "New {type}" |
*
* @param {Boost_Newboost_Generic1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newboost_generic1 = /** @type {((inputs: Boost_Newboost_Generic1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newboost_Generic1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newboost_generic1(inputs)
	if (locale === "es") return es_boost_newboost_generic1(inputs)
	if (locale === "fr") return fr_boost_newboost_generic1(inputs)
	return ar_boost_newboost_generic1(inputs)
});
export { boost_newboost_generic1 as "boost.newBoost.generic" }