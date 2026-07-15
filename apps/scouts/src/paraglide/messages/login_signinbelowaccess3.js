/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Signinbelowaccess3Inputs */

const en_login_signinbelowaccess3 = /** @type {(inputs: Login_Signinbelowaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Now just sign in below to access your account.`)
};

const es_login_signinbelowaccess3 = /** @type {(inputs: Login_Signinbelowaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ahora solo inicia sesión abajo para acceder a tu cuenta.`)
};

const fr_login_signinbelowaccess3 = /** @type {(inputs: Login_Signinbelowaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Il ne vous reste plus qu'à vous connecter ci-dessous pour accéder à votre compte.`)
};

const ar_login_signinbelowaccess3 = /** @type {(inputs: Login_Signinbelowaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الآن فقط سجل الدخول أدناه للوصول إلى حسابك.`)
};

/**
* | output |
* | --- |
* | "Now just sign in below to access your account." |
*
* @param {Login_Signinbelowaccess3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_signinbelowaccess3 = /** @type {((inputs?: Login_Signinbelowaccess3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Signinbelowaccess3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_signinbelowaccess3(inputs)
	if (locale === "es") return es_login_signinbelowaccess3(inputs)
	if (locale === "fr") return fr_login_signinbelowaccess3(inputs)
	return ar_login_signinbelowaccess3(inputs)
});
export { login_signinbelowaccess3 as "login.signInBelowAccess" }