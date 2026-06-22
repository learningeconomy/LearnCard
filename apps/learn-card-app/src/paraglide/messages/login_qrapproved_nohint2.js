/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Qrapproved_Nohint2Inputs */

const en_login_qrapproved_nohint2 = /** @type {(inputs: Login_Qrapproved_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Now just sign in below to access your account.`)
};

const es_login_qrapproved_nohint2 = /** @type {(inputs: Login_Qrapproved_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ahora solo inicia sesión abajo para acceder a tu cuenta.`)
};

const fr_login_qrapproved_nohint2 = /** @type {(inputs: Login_Qrapproved_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous ci-dessous pour accéder à votre compte.`)
};

const ar_login_qrapproved_nohint2 = /** @type {(inputs: Login_Qrapproved_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما عليك الآن سوى تسجيل الدخول أدناه للوصول إلى حسابك.`)
};

/**
* | output |
* | --- |
* | "Now just sign in below to access your account." |
*
* @param {Login_Qrapproved_Nohint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_qrapproved_nohint2 = /** @type {((inputs?: Login_Qrapproved_Nohint2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Qrapproved_Nohint2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_qrapproved_nohint2(inputs)
	if (locale === "es") return es_login_qrapproved_nohint2(inputs)
	if (locale === "fr") return fr_login_qrapproved_nohint2(inputs)
	return ar_login_qrapproved_nohint2(inputs)
});
export { login_qrapproved_nohint2 as "login.qrApproved.noHint" }