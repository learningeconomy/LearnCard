/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Password_CreateInputs */

const en_login_email_password_create = /** @type {(inputs: Login_Email_Password_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Account`)
};

const es_login_email_password_create = /** @type {(inputs: Login_Email_Password_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear cuenta`)
};

const de_login_email_password_create = /** @type {(inputs: Login_Email_Password_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Konto erstellen`)
};

const ar_login_email_password_create = /** @type {(inputs: Login_Email_Password_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء حساب`)
};

const fr_login_email_password_create = /** @type {(inputs: Login_Email_Password_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un compte`)
};

const ko_login_email_password_create = /** @type {(inputs: Login_Email_Password_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정 만들기`)
};

/**
* | output |
* | --- |
* | "Create Account" |
*
* @param {Login_Email_Password_CreateInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_password_create = /** @type {((inputs?: Login_Email_Password_CreateInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Password_CreateInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_password_create(inputs)
	if (locale === "es") return es_login_email_password_create(inputs)
	if (locale === "de") return de_login_email_password_create(inputs)
	if (locale === "ar") return ar_login_email_password_create(inputs)
	if (locale === "fr") return fr_login_email_password_create(inputs)
	return ko_login_email_password_create(inputs)
});
export { login_email_password_create as "login.email.password.create" }