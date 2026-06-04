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

const de_login_phone_smssent1 = /** @type {(inputs: Login_Phone_Smssent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ein Bestätigungscode wurde gesendet`)
};

const ar_login_phone_smssent1 = /** @type {(inputs: Login_Phone_Smssent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال رمز التحقق`)
};

const fr_login_phone_smssent1 = /** @type {(inputs: Login_Phone_Smssent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un code de vérification a été envoyé`)
};

const ko_login_phone_smssent1 = /** @type {(inputs: Login_Phone_Smssent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`인증 코드가 전송되었습니다`)
};

/**
* | output |
* | --- |
* | "A verification code has been sent" |
*
* @param {Login_Phone_Smssent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_smssent1 = /** @type {((inputs?: Login_Phone_Smssent1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_Smssent1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_smssent1(inputs)
	if (locale === "es") return es_login_phone_smssent1(inputs)
	if (locale === "de") return de_login_phone_smssent1(inputs)
	if (locale === "ar") return ar_login_phone_smssent1(inputs)
	if (locale === "fr") return fr_login_phone_smssent1(inputs)
	return ko_login_phone_smssent1(inputs)
});
export { login_phone_smssent1 as "login.phone.smsSent" }