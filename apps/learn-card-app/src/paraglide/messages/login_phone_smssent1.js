/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_Smssent1Inputs */

const en_login_phone_smssent1 = /** @type {(inputs: Login_Phone_Smssent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A verification code has been sent`)
};

const es_login_phone_smssent1 = /** @type {(inputs: Login_Phone_Smssent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se ha enviado un código de verificación`)
};

const fr_login_phone_smssent1 = /** @type {(inputs: Login_Phone_Smssent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un code de vérification a été envoyé`)
};

const ar_login_phone_smssent1 = /** @type {(inputs: Login_Phone_Smssent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال رمز التحقق`)
};

/**
* | output |
* | --- |
* | "A verification code has been sent" |
*
* @param {Login_Phone_Smssent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_phone_smssent1 = /** @type {((inputs?: Login_Phone_Smssent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_Smssent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_smssent1(inputs)
	if (locale === "es") return es_login_phone_smssent1(inputs)
	if (locale === "fr") return fr_login_phone_smssent1(inputs)
	return ar_login_phone_smssent1(inputs)
});
export { login_phone_smssent1 as "login.phone.smsSent" }