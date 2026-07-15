/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Jsonview1Inputs */

const en_boost_jsonview1 = /** @type {(inputs: Boost_Jsonview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON View`)
};

const es_boost_jsonview1 = /** @type {(inputs: Boost_Jsonview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista JSON`)
};

const fr_boost_jsonview1 = /** @type {(inputs: Boost_Jsonview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vue JSON`)
};

const ar_boost_jsonview1 = /** @type {(inputs: Boost_Jsonview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON View`)
};

/**
* | output |
* | --- |
* | "JSON View" |
*
* @param {Boost_Jsonview1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_jsonview1 = /** @type {((inputs?: Boost_Jsonview1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Jsonview1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_jsonview1(inputs)
	if (locale === "es") return es_boost_jsonview1(inputs)
	if (locale === "fr") return fr_boost_jsonview1(inputs)
	return ar_boost_jsonview1(inputs)
});
export { boost_jsonview1 as "boost.jsonView" }