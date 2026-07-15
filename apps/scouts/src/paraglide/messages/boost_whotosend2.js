/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Whotosend2Inputs */

const en_boost_whotosend2 = /** @type {(inputs: Boost_Whotosend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who do you want to send to?`)
};

const es_boost_whotosend2 = /** @type {(inputs: Boost_Whotosend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿A quién quieres enviar?`)
};

const fr_boost_whotosend2 = /** @type {(inputs: Boost_Whotosend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À qui voulez-vous envoyer ?`)
};

const ar_boost_whotosend2 = /** @type {(inputs: Boost_Whotosend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who do you want to send to?`)
};

/**
* | output |
* | --- |
* | "Who do you want to send to?" |
*
* @param {Boost_Whotosend2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_whotosend2 = /** @type {((inputs?: Boost_Whotosend2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Whotosend2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_whotosend2(inputs)
	if (locale === "es") return es_boost_whotosend2(inputs)
	if (locale === "fr") return fr_boost_whotosend2(inputs)
	return ar_boost_whotosend2(inputs)
});
export { boost_whotosend2 as "boost.whoToSend" }