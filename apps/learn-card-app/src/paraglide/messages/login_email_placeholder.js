/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_PlaceholderInputs */

const en_login_email_placeholder = /** @type {(inputs: Login_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email address`)
};

const es_login_email_placeholder = /** @type {(inputs: Login_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dirección de correo`)
};

const de_login_email_placeholder = /** @type {(inputs: Login_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-Mail-Adresse`)
};

const ar_login_email_placeholder = /** @type {(inputs: Login_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان البريد الإلكتروني`)
};

const fr_login_email_placeholder = /** @type {(inputs: Login_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adresse e-mail`)
};

const ko_login_email_placeholder = /** @type {(inputs: Login_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일 주소`)
};

/**
* | output |
* | --- |
* | "Email address" |
*
* @param {Login_Email_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_placeholder = /** @type {((inputs?: Login_Email_PlaceholderInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_PlaceholderInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_placeholder(inputs)
	if (locale === "es") return es_login_email_placeholder(inputs)
	if (locale === "de") return de_login_email_placeholder(inputs)
	if (locale === "ar") return ar_login_email_placeholder(inputs)
	if (locale === "fr") return fr_login_email_placeholder(inputs)
	return ko_login_email_placeholder(inputs)
});
export { login_email_placeholder as "login.email.placeholder" }