/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Restoringsession1Inputs */

const en_auth_restoringsession1 = /** @type {(inputs: Auth_Restoringsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restoring your session...`)
};

const es_auth_restoringsession1 = /** @type {(inputs: Auth_Restoringsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurando tu sesión...`)
};

const fr_auth_restoringsession1 = /** @type {(inputs: Auth_Restoringsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restauration de votre session...`)
};

const ar_auth_restoringsession1 = /** @type {(inputs: Auth_Restoringsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري استعادة جلستك...`)
};

/**
* | output |
* | --- |
* | "Restoring your session..." |
*
* @param {Auth_Restoringsession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_restoringsession1 = /** @type {((inputs?: Auth_Restoringsession1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Restoringsession1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_restoringsession1(inputs)
	if (locale === "es") return es_auth_restoringsession1(inputs)
	if (locale === "fr") return fr_auth_restoringsession1(inputs)
	return ar_auth_restoringsession1(inputs)
});
export { auth_restoringsession1 as "auth.restoringSession" }