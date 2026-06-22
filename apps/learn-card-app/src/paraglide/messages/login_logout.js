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

const fr_login_logout = /** @type {(inputs: Login_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion...`)
};

const ar_login_logout = /** @type {(inputs: Login_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تسجيل الخروج...`)
};

/**
* | output |
* | --- |
* | "Logging out..." |
*
* @param {Login_LogoutInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_logout = /** @type {((inputs?: Login_LogoutInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_LogoutInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_logout(inputs)
	if (locale === "es") return es_login_logout(inputs)
	if (locale === "fr") return fr_login_logout(inputs)
	return ar_login_logout(inputs)
});
export { login_logout as "login.logout" }