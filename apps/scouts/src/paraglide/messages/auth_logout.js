/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_LogoutInputs */

const en_auth_logout = /** @type {(inputs: Auth_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logout`)
};

const es_auth_logout = /** @type {(inputs: Auth_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar Sesión`)
};

const fr_auth_logout = /** @type {(inputs: Auth_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion`)
};

const ar_auth_logout = /** @type {(inputs: Auth_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logout`)
};

/**
* | output |
* | --- |
* | "Logout" |
*
* @param {Auth_LogoutInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_logout = /** @type {((inputs?: Auth_LogoutInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_LogoutInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_logout(inputs)
	if (locale === "es") return es_auth_logout(inputs)
	if (locale === "fr") return fr_auth_logout(inputs)
	return ar_auth_logout(inputs)
});
export { auth_logout as "auth.logout" }