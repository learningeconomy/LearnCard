/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Signinfromanotherdevice4Inputs */

const en_login_signinfromanotherdevice4 = /** @type {(inputs: Login_Signinfromanotherdevice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in from another device`)
};

const es_login_signinfromanotherdevice4 = /** @type {(inputs: Login_Signinfromanotherdevice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar sesión desde otro dispositivo`)
};

const fr_login_signinfromanotherdevice4 = /** @type {(inputs: Login_Signinfromanotherdevice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter depuis un autre appareil`)
};

const ar_login_signinfromanotherdevice4 = /** @type {(inputs: Login_Signinfromanotherdevice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول من جهاز آخر`)
};

/**
* | output |
* | --- |
* | "Sign in from another device" |
*
* @param {Login_Signinfromanotherdevice4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_signinfromanotherdevice4 = /** @type {((inputs?: Login_Signinfromanotherdevice4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Signinfromanotherdevice4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_signinfromanotherdevice4(inputs)
	if (locale === "es") return es_login_signinfromanotherdevice4(inputs)
	if (locale === "fr") return fr_login_signinfromanotherdevice4(inputs)
	return ar_login_signinfromanotherdevice4(inputs)
});
export { login_signinfromanotherdevice4 as "login.signInFromAnotherDevice" }