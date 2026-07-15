/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loginwithphone2Inputs */

const en_login_loginwithphone2 = /** @type {(inputs: Login_Loginwithphone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login With Phone Number`)
};

const es_login_loginwithphone2 = /** @type {(inputs: Login_Loginwithphone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar Sesión con Número de Teléfono`)
};

const fr_login_loginwithphone2 = /** @type {(inputs: Login_Loginwithphone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter avec un numéro de téléphone`)
};

const ar_login_loginwithphone2 = /** @type {(inputs: Login_Loginwithphone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول برقم الهاتف`)
};

/**
* | output |
* | --- |
* | "Login With Phone Number" |
*
* @param {Login_Loginwithphone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loginwithphone2 = /** @type {((inputs?: Login_Loginwithphone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loginwithphone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loginwithphone2(inputs)
	if (locale === "es") return es_login_loginwithphone2(inputs)
	if (locale === "fr") return fr_login_loginwithphone2(inputs)
	return ar_login_loginwithphone2(inputs)
});
export { login_loginwithphone2 as "login.loginWithPhone" }