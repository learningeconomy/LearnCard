/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_Password_LoginInputs */

const en_login_phone_password_login = /** @type {(inputs: Login_Phone_Password_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login`)
};

const es_login_phone_password_login = /** @type {(inputs: Login_Phone_Password_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar sesión`)
};

const de_login_phone_password_login = /** @type {(inputs: Login_Phone_Password_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anmelden`)
};

const ar_login_phone_password_login = /** @type {(inputs: Login_Phone_Password_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول`)
};

const fr_login_phone_password_login = /** @type {(inputs: Login_Phone_Password_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion`)
};

const ko_login_phone_password_login = /** @type {(inputs: Login_Phone_Password_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로그인`)
};

/**
* | output |
* | --- |
* | "Login" |
*
* @param {Login_Phone_Password_LoginInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_password_login = /** @type {((inputs?: Login_Phone_Password_LoginInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_Password_LoginInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_password_login(inputs)
	if (locale === "es") return es_login_phone_password_login(inputs)
	if (locale === "de") return de_login_phone_password_login(inputs)
	if (locale === "ar") return ar_login_phone_password_login(inputs)
	if (locale === "fr") return fr_login_phone_password_login(inputs)
	return ko_login_phone_password_login(inputs)
});
export { login_phone_password_login as "login.phone.password.login" }