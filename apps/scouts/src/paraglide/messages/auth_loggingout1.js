/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Loggingout1Inputs */

const en_auth_loggingout1 = /** @type {(inputs: Auth_Loggingout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logging out...`)
};

const es_auth_loggingout1 = /** @type {(inputs: Auth_Loggingout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrando sesión...`)
};

const fr_auth_loggingout1 = /** @type {(inputs: Auth_Loggingout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion en cours...`)
};

const ar_auth_loggingout1 = /** @type {(inputs: Auth_Loggingout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logging out...`)
};

/**
* | output |
* | --- |
* | "Logging out..." |
*
* @param {Auth_Loggingout1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_loggingout1 = /** @type {((inputs?: Auth_Loggingout1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Loggingout1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_loggingout1(inputs)
	if (locale === "es") return es_auth_loggingout1(inputs)
	if (locale === "fr") return fr_auth_loggingout1(inputs)
	return ar_auth_loggingout1(inputs)
});
export { auth_loggingout1 as "auth.loggingOut" }