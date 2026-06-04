/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Sendingcode1Inputs */

const en_login_email_sendingcode1 = /** @type {(inputs: Login_Email_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending Code...`)
};

const es_login_email_sendingcode1 = /** @type {(inputs: Login_Email_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando código...`)
};

const de_login_email_sendingcode1 = /** @type {(inputs: Login_Email_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code wird gesendet...`)
};

const ar_login_email_sendingcode1 = /** @type {(inputs: Login_Email_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري إرسال الرمز...`)
};

const fr_login_email_sendingcode1 = /** @type {(inputs: Login_Email_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi du code...`)
};

const ko_login_email_sendingcode1 = /** @type {(inputs: Login_Email_Sendingcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`코드 전송 중...`)
};

/**
* | output |
* | --- |
* | "Sending Code..." |
*
* @param {Login_Email_Sendingcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_sendingcode1 = /** @type {((inputs?: Login_Email_Sendingcode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Sendingcode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_sendingcode1(inputs)
	if (locale === "es") return es_login_email_sendingcode1(inputs)
	if (locale === "de") return de_login_email_sendingcode1(inputs)
	if (locale === "ar") return ar_login_email_sendingcode1(inputs)
	if (locale === "fr") return fr_login_email_sendingcode1(inputs)
	return ko_login_email_sendingcode1(inputs)
});
export { login_email_sendingcode1 as "login.email.sendingCode" }