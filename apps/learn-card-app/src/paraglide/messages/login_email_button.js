/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_ButtonInputs */

const en_login_email_button = /** @type {(inputs: Login_Email_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in with Email`)
};

const es_login_email_button = /** @type {(inputs: Login_Email_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar sesión con correo`)
};

const de_login_email_button = /** @type {(inputs: Login_Email_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mit E-Mail anmelden`)
};

const ar_login_email_button = /** @type {(inputs: Login_Email_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول بالبريد الإلكتروني`)
};

const fr_login_email_button = /** @type {(inputs: Login_Email_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter par e-mail`)
};

const ko_login_email_button = /** @type {(inputs: Login_Email_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일로 로그인`)
};

/**
* | output |
* | --- |
* | "Sign in with Email" |
*
* @param {Login_Email_ButtonInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_button = /** @type {((inputs?: Login_Email_ButtonInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_ButtonInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_button(inputs)
	if (locale === "es") return es_login_email_button(inputs)
	if (locale === "de") return de_login_email_button(inputs)
	if (locale === "ar") return ar_login_email_button(inputs)
	if (locale === "fr") return fr_login_email_button(inputs)
	return ko_login_email_button(inputs)
});
export { login_email_button as "login.email.button" }