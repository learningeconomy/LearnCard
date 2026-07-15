/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Continuetosignin3Inputs */

const en_login_continuetosignin3 = /** @type {(inputs: Login_Continuetosignin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Sign In`)
};

const es_login_continuetosignin3 = /** @type {(inputs: Login_Continuetosignin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar para Iniciar Sesión`)
};

const fr_login_continuetosignin3 = /** @type {(inputs: Login_Continuetosignin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer vers la connexion`)
};

const ar_login_continuetosignin3 = /** @type {(inputs: Login_Continuetosignin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Sign In`)
};

/**
* | output |
* | --- |
* | "Continue to Sign In" |
*
* @param {Login_Continuetosignin3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_continuetosignin3 = /** @type {((inputs?: Login_Continuetosignin3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Continuetosignin3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_continuetosignin3(inputs)
	if (locale === "es") return es_login_continuetosignin3(inputs)
	if (locale === "fr") return fr_login_continuetosignin3(inputs)
	return ar_login_continuetosignin3(inputs)
});
export { login_continuetosignin3 as "login.continueToSignIn" }