/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_LogoutInputs */

const en_login_logout = /** @type {(inputs: Login_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logging out...`)
};

const es_login_logout = /** @type {(inputs: Login_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrando sesión...`)
};

const de_login_logout = /** @type {(inputs: Login_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird abgemeldet...`)
};

const ar_login_logout = /** @type {(inputs: Login_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تسجيل الخروج...`)
};

const fr_login_logout = /** @type {(inputs: Login_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion...`)
};

const ko_login_logout = /** @type {(inputs: Login_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로그아웃 중...`)
};

/**
* | output |
* | --- |
* | "Logging out..." |
*
* @param {Login_LogoutInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_logout = /** @type {((inputs?: Login_LogoutInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_LogoutInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_logout(inputs)
	if (locale === "es") return es_login_logout(inputs)
	if (locale === "de") return de_login_logout(inputs)
	if (locale === "ar") return ar_login_logout(inputs)
	if (locale === "fr") return fr_login_logout(inputs)
	return ko_login_logout(inputs)
});
export { login_logout as "login.logout" }