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

const fr_login_email_error_invalidemail1 = /** @type {(inputs: Login_Email_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail manquant ou invalide`)
};

const ar_login_email_error_invalidemail1 = /** @type {(inputs: Login_Email_Error_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بريد إلكتروني مفقود أو غير صالح`)
};

/**
* | output |
* | --- |
* | "Missing or Invalid Email" |
*
* @param {Login_Email_Error_Invalidemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_email_error_invalidemail1 = /** @type {((inputs?: Login_Email_Error_Invalidemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Error_Invalidemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_error_invalidemail1(inputs)
	if (locale === "es") return es_login_email_error_invalidemail1(inputs)
	if (locale === "fr") return fr_login_email_error_invalidemail1(inputs)
	return ar_login_email_error_invalidemail1(inputs)
});
export { login_email_error_invalidemail1 as "login.email.error.invalidEmail" }