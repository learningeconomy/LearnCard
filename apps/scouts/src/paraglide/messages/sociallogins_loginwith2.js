/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sociallogins_Loginwith2Inputs */

const en_sociallogins_loginwith2 = /** @type {(inputs: Sociallogins_Loginwith2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login With`)
};

const es_sociallogins_loginwith2 = /** @type {(inputs: Sociallogins_Loginwith2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar Sesión Con`)
};

const fr_sociallogins_loginwith2 = /** @type {(inputs: Sociallogins_Loginwith2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous avec`)
};

const ar_sociallogins_loginwith2 = /** @type {(inputs: Sociallogins_Loginwith2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول باستخدام`)
};

/**
* | output |
* | --- |
* | "Login With" |
*
* @param {Sociallogins_Loginwith2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sociallogins_loginwith2 = /** @type {((inputs?: Sociallogins_Loginwith2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sociallogins_Loginwith2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sociallogins_loginwith2(inputs)
	if (locale === "es") return es_sociallogins_loginwith2(inputs)
	if (locale === "fr") return fr_sociallogins_loginwith2(inputs)
	return ar_sociallogins_loginwith2(inputs)
});
export { sociallogins_loginwith2 as "socialLogins.loginWith" }