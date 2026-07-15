/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_SendingInputs */

const en_boost_sending = /** @type {(inputs: Boost_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_boost_sending = /** @type {(inputs: Boost_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando...`)
};

const fr_boost_sending = /** @type {(inputs: Boost_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi en cours...`)
};

const ar_boost_sending = /** @type {(inputs: Boost_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإرسال...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Boost_SendingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_sending = /** @type {((inputs?: Boost_SendingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_SendingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_sending(inputs)
	if (locale === "es") return es_boost_sending(inputs)
	if (locale === "fr") return fr_boost_sending(inputs)
	return ar_boost_sending(inputs)
});
export { boost_sending as "boost.sending" }