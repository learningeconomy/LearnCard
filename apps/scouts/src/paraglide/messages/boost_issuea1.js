/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Issuea1Inputs */

const en_boost_issuea1 = /** @type {(inputs: Boost_Issuea1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue a`)
};

const es_boost_issuea1 = /** @type {(inputs: Boost_Issuea1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir un`)
};

const fr_boost_issuea1 = /** @type {(inputs: Boost_Issuea1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivrer un`)
};

const ar_boost_issuea1 = /** @type {(inputs: Boost_Issuea1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار`)
};

/**
* | output |
* | --- |
* | "Issue a" |
*
* @param {Boost_Issuea1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_issuea1 = /** @type {((inputs?: Boost_Issuea1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Issuea1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_issuea1(inputs)
	if (locale === "es") return es_boost_issuea1(inputs)
	if (locale === "fr") return fr_boost_issuea1(inputs)
	return ar_boost_issuea1(inputs)
});
export { boost_issuea1 as "boost.issueA" }