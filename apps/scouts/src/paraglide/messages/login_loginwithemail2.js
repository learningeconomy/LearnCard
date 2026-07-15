/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loginwithemail2Inputs */

const en_login_loginwithemail2 = /** @type {(inputs: Login_Loginwithemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login with Email`)
};

const es_login_loginwithemail2 = /** @type {(inputs: Login_Loginwithemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar Sesión con Correo`)
};

const fr_login_loginwithemail2 = /** @type {(inputs: Login_Loginwithemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter avec un e-mail`)
};

const ar_login_loginwithemail2 = /** @type {(inputs: Login_Loginwithemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login with Email`)
};

/**
* | output |
* | --- |
* | "Login with Email" |
*
* @param {Login_Loginwithemail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loginwithemail2 = /** @type {((inputs?: Login_Loginwithemail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loginwithemail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loginwithemail2(inputs)
	if (locale === "es") return es_login_loginwithemail2(inputs)
	if (locale === "fr") return fr_login_loginwithemail2(inputs)
	return ar_login_loginwithemail2(inputs)
});
export { login_loginwithemail2 as "login.loginWithEmail" }