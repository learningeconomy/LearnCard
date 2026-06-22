/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Shortboost_Others1Inputs */

const en_boost_shortboost_others1 = /** @type {(inputs: Boost_Shortboost_Others1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Others`)
};

const es_boost_shortboost_others1 = /** @type {(inputs: Boost_Shortboost_Others1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otros`)
};

const fr_boost_shortboost_others1 = /** @type {(inputs: Boost_Shortboost_Others1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autres`)
};

const ar_boost_shortboost_others1 = /** @type {(inputs: Boost_Shortboost_Others1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`آخرون`)
};

/**
* | output |
* | --- |
* | "Others" |
*
* @param {Boost_Shortboost_Others1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_shortboost_others1 = /** @type {((inputs?: Boost_Shortboost_Others1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Shortboost_Others1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_shortboost_others1(inputs)
	if (locale === "es") return es_boost_shortboost_others1(inputs)
	if (locale === "fr") return fr_boost_shortboost_others1(inputs)
	return ar_boost_shortboost_others1(inputs)
});
export { boost_shortboost_others1 as "boost.shortBoost.others" }