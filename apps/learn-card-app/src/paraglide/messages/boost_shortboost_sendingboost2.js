/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Shortboost_Sendingboost2Inputs */

const en_boost_shortboost_sendingboost2 = /** @type {(inputs: Boost_Shortboost_Sendingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending Boost`)
};

const es_boost_shortboost_sendingboost2 = /** @type {(inputs: Boost_Shortboost_Sendingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando Boost`)
};

const fr_boost_shortboost_sendingboost2 = /** @type {(inputs: Boost_Shortboost_Sendingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi du Boost`)
};

const ar_boost_shortboost_sendingboost2 = /** @type {(inputs: Boost_Shortboost_Sendingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إرسال Boost`)
};

/**
* | output |
* | --- |
* | "Sending Boost" |
*
* @param {Boost_Shortboost_Sendingboost2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_shortboost_sendingboost2 = /** @type {((inputs?: Boost_Shortboost_Sendingboost2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Shortboost_Sendingboost2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_shortboost_sendingboost2(inputs)
	if (locale === "es") return es_boost_shortboost_sendingboost2(inputs)
	if (locale === "fr") return fr_boost_shortboost_sendingboost2(inputs)
	return ar_boost_shortboost_sendingboost2(inputs)
});
export { boost_shortboost_sendingboost2 as "boost.shortBoost.sendingBoost" }