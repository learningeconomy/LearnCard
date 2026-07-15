/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Sendcode1Inputs */

const en_login_sendcode1 = /** @type {(inputs: Login_Sendcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Code`)
};

const es_login_sendcode1 = /** @type {(inputs: Login_Sendcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Código`)
};

const fr_login_sendcode1 = /** @type {(inputs: Login_Sendcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer le code`)
};

const ar_login_sendcode1 = /** @type {(inputs: Login_Sendcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال الرمز`)
};

/**
* | output |
* | --- |
* | "Send Code" |
*
* @param {Login_Sendcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_sendcode1 = /** @type {((inputs?: Login_Sendcode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Sendcode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_sendcode1(inputs)
	if (locale === "es") return es_login_sendcode1(inputs)
	if (locale === "fr") return fr_login_sendcode1(inputs)
	return ar_login_sendcode1(inputs)
});
export { login_sendcode1 as "login.sendCode" }