/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Sessionrestored1Inputs */

const en_auth_sessionrestored1 = /** @type {(inputs: Auth_Sessionrestored1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session Restored`)
};

const es_auth_sessionrestored1 = /** @type {(inputs: Auth_Sessionrestored1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesión Restaurada`)
};

const fr_auth_sessionrestored1 = /** @type {(inputs: Auth_Sessionrestored1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session restaurée`)
};

const ar_auth_sessionrestored1 = /** @type {(inputs: Auth_Sessionrestored1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session Restored`)
};

/**
* | output |
* | --- |
* | "Session Restored" |
*
* @param {Auth_Sessionrestored1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_sessionrestored1 = /** @type {((inputs?: Auth_Sessionrestored1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sessionrestored1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_sessionrestored1(inputs)
	if (locale === "es") return es_auth_sessionrestored1(inputs)
	if (locale === "fr") return fr_auth_sessionrestored1(inputs)
	return ar_auth_sessionrestored1(inputs)
});
export { auth_sessionrestored1 as "auth.sessionRestored" }