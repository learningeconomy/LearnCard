/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_Password_PlaceholderInputs */

const en_login_phone_password_placeholder = /** @type {(inputs: Login_Phone_Password_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Password`)
};

const es_login_phone_password_placeholder = /** @type {(inputs: Login_Phone_Password_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contraseña`)
};

const de_login_phone_password_placeholder = /** @type {(inputs: Login_Phone_Password_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passwort`)
};

const ar_login_phone_password_placeholder = /** @type {(inputs: Login_Phone_Password_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمة المرور`)
};

const fr_login_phone_password_placeholder = /** @type {(inputs: Login_Phone_Password_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe`)
};

const ko_login_phone_password_placeholder = /** @type {(inputs: Login_Phone_Password_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`비밀번호`)
};

/**
* | output |
* | --- |
* | "Password" |
*
* @param {Login_Phone_Password_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_password_placeholder = /** @type {((inputs?: Login_Phone_Password_PlaceholderInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_Password_PlaceholderInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_password_placeholder(inputs)
	if (locale === "es") return es_login_phone_password_placeholder(inputs)
	if (locale === "de") return de_login_phone_password_placeholder(inputs)
	if (locale === "ar") return ar_login_phone_password_placeholder(inputs)
	if (locale === "fr") return fr_login_phone_password_placeholder(inputs)
	return ko_login_phone_password_placeholder(inputs)
});
export { login_phone_password_placeholder as "login.phone.password.placeholder" }