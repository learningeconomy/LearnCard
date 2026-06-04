/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_Password_Staysignedin2Inputs */

const en_login_phone_password_staysignedin2 = /** @type {(inputs: Login_Phone_Password_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stay Signed In`)
};

const es_login_phone_password_staysignedin2 = /** @type {(inputs: Login_Phone_Password_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permanecer conectado`)
};

const de_login_phone_password_staysignedin2 = /** @type {(inputs: Login_Phone_Password_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Angemeldet bleiben`)
};

const ar_login_phone_password_staysignedin2 = /** @type {(inputs: Login_Phone_Password_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البقاء مسجلاً`)
};

const fr_login_phone_password_staysignedin2 = /** @type {(inputs: Login_Phone_Password_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rester connecté`)
};

const ko_login_phone_password_staysignedin2 = /** @type {(inputs: Login_Phone_Password_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로그인 상태 유지`)
};

/**
* | output |
* | --- |
* | "Stay Signed In" |
*
* @param {Login_Phone_Password_Staysignedin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_password_staysignedin2 = /** @type {((inputs?: Login_Phone_Password_Staysignedin2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_Password_Staysignedin2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_password_staysignedin2(inputs)
	if (locale === "es") return es_login_phone_password_staysignedin2(inputs)
	if (locale === "de") return de_login_phone_password_staysignedin2(inputs)
	if (locale === "ar") return ar_login_phone_password_staysignedin2(inputs)
	if (locale === "fr") return fr_login_phone_password_staysignedin2(inputs)
	return ko_login_phone_password_staysignedin2(inputs)
});
export { login_phone_password_staysignedin2 as "login.phone.password.staySignedIn" }