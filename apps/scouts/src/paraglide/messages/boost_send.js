/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_SendInputs */

const en_boost_send = /** @type {(inputs: Boost_SendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send`)
};

const es_boost_send = /** @type {(inputs: Boost_SendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar`)
};

const fr_boost_send = /** @type {(inputs: Boost_SendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer`)
};

const ar_boost_send = /** @type {(inputs: Boost_SendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال`)
};

/**
* | output |
* | --- |
* | "Send" |
*
* @param {Boost_SendInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_send = /** @type {((inputs?: Boost_SendInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_SendInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_send(inputs)
	if (locale === "es") return es_boost_send(inputs)
	if (locale === "fr") return fr_boost_send(inputs)
	return ar_boost_send(inputs)
});
export { boost_send as "boost.send" }