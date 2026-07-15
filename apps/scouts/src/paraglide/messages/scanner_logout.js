/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_LogoutInputs */

const en_scanner_logout = /** @type {(inputs: Scanner_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logout`)
};

const es_scanner_logout = /** @type {(inputs: Scanner_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar Sesión`)
};

const fr_scanner_logout = /** @type {(inputs: Scanner_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion`)
};

const ar_scanner_logout = /** @type {(inputs: Scanner_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logout`)
};

/**
* | output |
* | --- |
* | "Logout" |
*
* @param {Scanner_LogoutInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_logout = /** @type {((inputs?: Scanner_LogoutInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_LogoutInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_logout(inputs)
	if (locale === "es") return es_scanner_logout(inputs)
	if (locale === "fr") return fr_scanner_logout(inputs)
	return ar_scanner_logout(inputs)
});
export { scanner_logout as "scanner.logout" }