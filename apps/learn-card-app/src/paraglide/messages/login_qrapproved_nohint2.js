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

const de_login_qrapproved_nohint2 = /** @type {(inputs: Login_Qrapproved_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Melde dich jetzt unten an, um auf dein Konto zuzugreifen.`)
};

const ar_login_qrapproved_nohint2 = /** @type {(inputs: Login_Qrapproved_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما عليك الآن سوى تسجيل الدخول أدناه للوصول إلى حسابك.`)
};

const fr_login_qrapproved_nohint2 = /** @type {(inputs: Login_Qrapproved_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous ci-dessous pour accéder à votre compte.`)
};

const ko_login_qrapproved_nohint2 = /** @type {(inputs: Login_Qrapproved_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아래에서 로그인하여 계정에 액세스하세요.`)
};

/**
* | output |
* | --- |
* | "Now just sign in below to access your account." |
*
* @param {Login_Qrapproved_Nohint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_qrapproved_nohint2 = /** @type {((inputs?: Login_Qrapproved_Nohint2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Qrapproved_Nohint2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_qrapproved_nohint2(inputs)
	if (locale === "es") return es_login_qrapproved_nohint2(inputs)
	if (locale === "de") return de_login_qrapproved_nohint2(inputs)
	if (locale === "ar") return ar_login_qrapproved_nohint2(inputs)
	if (locale === "fr") return fr_login_qrapproved_nohint2(inputs)
	return ko_login_qrapproved_nohint2(inputs)
});
export { login_qrapproved_nohint2 as "login.qrApproved.noHint" }