/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Claimboost1Inputs */

const en_boost_claimboost1 = /** @type {(inputs: Boost_Claimboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim`)
};

const es_boost_claimboost1 = /** @type {(inputs: Boost_Claimboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamar`)
};

const de_boost_claimboost1 = /** @type {(inputs: Boost_Claimboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beanspruchen`)
};

const ar_boost_claimboost1 = /** @type {(inputs: Boost_Claimboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطالبة`)
};

const fr_boost_claimboost1 = /** @type {(inputs: Boost_Claimboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamer`)
};

const ko_boost_claimboost1 = /** @type {(inputs: Boost_Claimboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수령`)
};

/**
* | output |
* | --- |
* | "Claim" |
*
* @param {Boost_Claimboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_claimboost1 = /** @type {((inputs?: Boost_Claimboost1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Claimboost1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_claimboost1(inputs)
	if (locale === "es") return es_boost_claimboost1(inputs)
	if (locale === "de") return de_boost_claimboost1(inputs)
	if (locale === "ar") return ar_boost_claimboost1(inputs)
	if (locale === "fr") return fr_boost_claimboost1(inputs)
	return ko_boost_claimboost1(inputs)
});
export { boost_claimboost1 as "boost.claimBoost" }