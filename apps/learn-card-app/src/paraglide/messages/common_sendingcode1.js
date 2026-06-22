/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Sendingcode1Inputs */

const en_common_sendingcode1 = /** @type {(inputs: Common_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending Code...`)
};

const es_common_sendingcode1 = /** @type {(inputs: Common_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando código...`)
};

const fr_common_sendingcode1 = /** @type {(inputs: Common_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi du code...`)
};

const ar_common_sendingcode1 = /** @type {(inputs: Common_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري إرسال الرمز...`)
};

/**
* | output |
* | --- |
* | "Sending Code..." |
*
* @param {Common_Sendingcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_sendingcode1 = /** @type {((inputs?: Common_Sendingcode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Sendingcode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_sendingcode1(inputs)
	if (locale === "es") return es_common_sendingcode1(inputs)
	if (locale === "fr") return fr_common_sendingcode1(inputs)
	return ar_common_sendingcode1(inputs)
});
export { common_sendingcode1 as "common.sendingCode" }