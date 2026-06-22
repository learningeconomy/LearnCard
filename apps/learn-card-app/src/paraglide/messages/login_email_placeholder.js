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

const fr_login_email_placeholder = /** @type {(inputs: Login_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adresse e-mail`)
};

const ar_login_email_placeholder = /** @type {(inputs: Login_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email address" |
*
* @param {Login_Email_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_email_placeholder = /** @type {((inputs?: Login_Email_PlaceholderInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_PlaceholderInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_placeholder(inputs)
	if (locale === "es") return es_login_email_placeholder(inputs)
	if (locale === "fr") return fr_login_email_placeholder(inputs)
	return ar_login_email_placeholder(inputs)
});
export { login_email_placeholder as "login.email.placeholder" }