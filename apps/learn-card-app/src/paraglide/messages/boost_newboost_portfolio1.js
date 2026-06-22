/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Newboost_Portfolio1Inputs */

const en_boost_newboost_portfolio1 = /** @type {(inputs: Boost_Newboost_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Portfolio`)
};

const es_boost_newboost_portfolio1 = /** @type {(inputs: Boost_Newboost_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo portafolio`)
};

const fr_boost_newboost_portfolio1 = /** @type {(inputs: Boost_Newboost_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau portfolio`)
};

const ar_boost_newboost_portfolio1 = /** @type {(inputs: Boost_Newboost_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف أعمال جديد`)
};

/**
* | output |
* | --- |
* | "New Portfolio" |
*
* @param {Boost_Newboost_Portfolio1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newboost_portfolio1 = /** @type {((inputs?: Boost_Newboost_Portfolio1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newboost_Portfolio1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newboost_portfolio1(inputs)
	if (locale === "es") return es_boost_newboost_portfolio1(inputs)
	if (locale === "fr") return fr_boost_newboost_portfolio1(inputs)
	return ar_boost_newboost_portfolio1(inputs)
});
export { boost_newboost_portfolio1 as "boost.newBoost.portfolio" }