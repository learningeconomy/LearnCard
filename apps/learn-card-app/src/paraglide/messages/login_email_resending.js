/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_ResendingInputs */

const en_login_email_resending = /** @type {(inputs: Login_Email_ResendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending Code...`)
};

const es_login_email_resending = /** @type {(inputs: Login_Email_ResendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando código...`)
};

const de_login_email_resending = /** @type {(inputs: Login_Email_ResendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code wird gesendet...`)
};

const ar_login_email_resending = /** @type {(inputs: Login_Email_ResendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري إرسال الرمز...`)
};

const fr_login_email_resending = /** @type {(inputs: Login_Email_ResendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi du code...`)
};

const ko_login_email_resending = /** @type {(inputs: Login_Email_ResendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`코드 전송 중...`)
};

/**
* | output |
* | --- |
* | "Sending Code..." |
*
* @param {Login_Email_ResendingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_resending = /** @type {((inputs?: Login_Email_ResendingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_ResendingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_resending(inputs)
	if (locale === "es") return es_login_email_resending(inputs)
	if (locale === "de") return de_login_email_resending(inputs)
	if (locale === "ar") return ar_login_email_resending(inputs)
	if (locale === "fr") return fr_login_email_resending(inputs)
	return ko_login_email_resending(inputs)
});
export { login_email_resending as "login.email.resending" }