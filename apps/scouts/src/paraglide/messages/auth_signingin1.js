/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Signingin1Inputs */

const en_auth_signingin1 = /** @type {(inputs: Auth_Signingin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing in...`)
};

const es_auth_signingin1 = /** @type {(inputs: Auth_Signingin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciando sesión...`)
};

const fr_auth_signingin1 = /** @type {(inputs: Auth_Signingin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion en cours...`)
};

const ar_auth_signingin1 = /** @type {(inputs: Auth_Signingin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تسجيل الدخول...`)
};

/**
* | output |
* | --- |
* | "Signing in..." |
*
* @param {Auth_Signingin1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_signingin1 = /** @type {((inputs?: Auth_Signingin1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Signingin1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_signingin1(inputs)
	if (locale === "es") return es_auth_signingin1(inputs)
	if (locale === "fr") return fr_auth_signingin1(inputs)
	return ar_auth_signingin1(inputs)
});
export { auth_signingin1 as "auth.signingIn" }