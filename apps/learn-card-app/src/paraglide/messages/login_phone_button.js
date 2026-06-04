/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_ButtonInputs */

const en_login_phone_button = /** @type {(inputs: Login_Phone_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in with SMS`)
};

const es_login_phone_button = /** @type {(inputs: Login_Phone_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar sesión con SMS`)
};

const de_login_phone_button = /** @type {(inputs: Login_Phone_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mit SMS anmelden`)
};

const ar_login_phone_button = /** @type {(inputs: Login_Phone_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول برسالة نصية`)
};

const fr_login_phone_button = /** @type {(inputs: Login_Phone_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter par SMS`)
};

const ko_login_phone_button = /** @type {(inputs: Login_Phone_ButtonInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SMS로 로그인`)
};

/**
* | output |
* | --- |
* | "Sign in with SMS" |
*
* @param {Login_Phone_ButtonInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_button = /** @type {((inputs?: Login_Phone_ButtonInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_ButtonInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_button(inputs)
	if (locale === "es") return es_login_phone_button(inputs)
	if (locale === "de") return de_login_phone_button(inputs)
	if (locale === "ar") return ar_login_phone_button(inputs)
	if (locale === "fr") return fr_login_phone_button(inputs)
	return ko_login_phone_button(inputs)
});
export { login_phone_button as "login.phone.button" }