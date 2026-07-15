/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Sendlogincode2Inputs */

const en_login_sendlogincode2 = /** @type {(inputs: Login_Sendlogincode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Login Code`)
};

const es_login_sendlogincode2 = /** @type {(inputs: Login_Sendlogincode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Código de Inicio`)
};

const fr_login_sendlogincode2 = /** @type {(inputs: Login_Sendlogincode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer le code de connexion`)
};

const ar_login_sendlogincode2 = /** @type {(inputs: Login_Sendlogincode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال رمز تسجيل الدخول`)
};

/**
* | output |
* | --- |
* | "Send Login Code" |
*
* @param {Login_Sendlogincode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_sendlogincode2 = /** @type {((inputs?: Login_Sendlogincode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Sendlogincode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_sendlogincode2(inputs)
	if (locale === "es") return es_login_sendlogincode2(inputs)
	if (locale === "fr") return fr_login_sendlogincode2(inputs)
	return ar_login_sendlogincode2(inputs)
});
export { login_sendlogincode2 as "login.sendLoginCode" }