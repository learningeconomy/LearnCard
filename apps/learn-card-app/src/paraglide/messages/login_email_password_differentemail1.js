/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Password_Differentemail1Inputs */

const en_login_email_password_differentemail1 = /** @type {(inputs: Login_Email_Password_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a different email address`)
};

const es_login_email_password_differentemail1 = /** @type {(inputs: Login_Email_Password_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar otro correo`)
};

const de_login_email_password_differentemail1 = /** @type {(inputs: Login_Email_Password_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Andere E-Mail verwenden`)
};

const ar_login_email_password_differentemail1 = /** @type {(inputs: Login_Email_Password_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدام بريد إلكتروني آخر`)
};

const fr_login_email_password_differentemail1 = /** @type {(inputs: Login_Email_Password_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser une autre adresse e-mail`)
};

const ko_login_email_password_differentemail1 = /** @type {(inputs: Login_Email_Password_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다른 이메일 사용`)
};

/**
* | output |
* | --- |
* | "Use a different email address" |
*
* @param {Login_Email_Password_Differentemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_password_differentemail1 = /** @type {((inputs?: Login_Email_Password_Differentemail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Password_Differentemail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_password_differentemail1(inputs)
	if (locale === "es") return es_login_email_password_differentemail1(inputs)
	if (locale === "de") return de_login_email_password_differentemail1(inputs)
	if (locale === "ar") return ar_login_email_password_differentemail1(inputs)
	if (locale === "fr") return fr_login_email_password_differentemail1(inputs)
	return ko_login_email_password_differentemail1(inputs)
});
export { login_email_password_differentemail1 as "login.email.password.differentEmail" }