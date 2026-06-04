/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Sendboost1Inputs */

const en_boost_sendboost1 = /** @type {(inputs: Boost_Sendboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send`)
};

const es_boost_sendboost1 = /** @type {(inputs: Boost_Sendboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar`)
};

const de_boost_sendboost1 = /** @type {(inputs: Boost_Sendboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Senden`)
};

const ar_boost_sendboost1 = /** @type {(inputs: Boost_Sendboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال`)
};

const fr_boost_sendboost1 = /** @type {(inputs: Boost_Sendboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer`)
};

const ko_boost_sendboost1 = /** @type {(inputs: Boost_Sendboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보내기`)
};

/**
* | output |
* | --- |
* | "Send" |
*
* @param {Boost_Sendboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_sendboost1 = /** @type {((inputs?: Boost_Sendboost1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Sendboost1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_sendboost1(inputs)
	if (locale === "es") return es_boost_sendboost1(inputs)
	if (locale === "de") return de_boost_sendboost1(inputs)
	if (locale === "ar") return ar_boost_sendboost1(inputs)
	if (locale === "fr") return fr_boost_sendboost1(inputs)
	return ko_boost_sendboost1(inputs)
});
export { boost_sendboost1 as "boost.sendBoost" }