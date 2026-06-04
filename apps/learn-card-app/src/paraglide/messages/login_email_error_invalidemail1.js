/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Error_Invalidemail1Inputs */

const en_login_email_error_invalidemail1 = /** @type {(inputs: Login_Email_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Missing or Invalid Email`)
};

const es_login_email_error_invalidemail1 = /** @type {(inputs: Login_Email_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo faltante o inválido`)
};

const de_login_email_error_invalidemail1 = /** @type {(inputs: Login_Email_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fehlende oder ungültige E-Mail`)
};

const ar_login_email_error_invalidemail1 = /** @type {(inputs: Login_Email_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بريد إلكتروني مفقود أو غير صالح`)
};

const fr_login_email_error_invalidemail1 = /** @type {(inputs: Login_Email_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail manquant ou invalide`)
};

const ko_login_email_error_invalidemail1 = /** @type {(inputs: Login_Email_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일이 누락되었거나 유효하지 않습니다`)
};

/**
* | output |
* | --- |
* | "Missing or Invalid Email" |
*
* @param {Login_Email_Error_Invalidemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_error_invalidemail1 = /** @type {((inputs?: Login_Email_Error_Invalidemail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Error_Invalidemail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_error_invalidemail1(inputs)
	if (locale === "es") return es_login_email_error_invalidemail1(inputs)
	if (locale === "de") return de_login_email_error_invalidemail1(inputs)
	if (locale === "ar") return ar_login_email_error_invalidemail1(inputs)
	if (locale === "fr") return fr_login_email_error_invalidemail1(inputs)
	return ko_login_email_error_invalidemail1(inputs)
});
export { login_email_error_invalidemail1 as "login.email.error.invalidEmail" }