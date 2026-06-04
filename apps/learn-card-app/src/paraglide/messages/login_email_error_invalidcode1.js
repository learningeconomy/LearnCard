/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Error_Invalidcode1Inputs */

const en_login_email_error_invalidcode1 = /** @type {(inputs: Login_Email_Error_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid code`)
};

const es_login_email_error_invalidcode1 = /** @type {(inputs: Login_Email_Error_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código inválido`)
};

const de_login_email_error_invalidcode1 = /** @type {(inputs: Login_Email_Error_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ungültiger Code`)
};

const ar_login_email_error_invalidcode1 = /** @type {(inputs: Login_Email_Error_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز غير صالح`)
};

const fr_login_email_error_invalidcode1 = /** @type {(inputs: Login_Email_Error_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code invalide`)
};

const ko_login_email_error_invalidcode1 = /** @type {(inputs: Login_Email_Error_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유효하지 않은 코드`)
};

/**
* | output |
* | --- |
* | "Invalid code" |
*
* @param {Login_Email_Error_Invalidcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_error_invalidcode1 = /** @type {((inputs?: Login_Email_Error_Invalidcode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Error_Invalidcode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_error_invalidcode1(inputs)
	if (locale === "es") return es_login_email_error_invalidcode1(inputs)
	if (locale === "de") return de_login_email_error_invalidcode1(inputs)
	if (locale === "ar") return ar_login_email_error_invalidcode1(inputs)
	if (locale === "fr") return fr_login_email_error_invalidcode1(inputs)
	return ko_login_email_error_invalidcode1(inputs)
});
export { login_email_error_invalidcode1 as "login.email.error.invalidCode" }