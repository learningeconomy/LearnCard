/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_ResendInputs */

const en_login_phone_resend = /** @type {(inputs: Login_Phone_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resend Code`)
};

const es_login_phone_resend = /** @type {(inputs: Login_Phone_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reenviar código`)
};

const de_login_phone_resend = /** @type {(inputs: Login_Phone_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code erneut senden`)
};

const ar_login_phone_resend = /** @type {(inputs: Login_Phone_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة إرسال الرمز`)
};

const fr_login_phone_resend = /** @type {(inputs: Login_Phone_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renvoyer le code`)
};

const ko_login_phone_resend = /** @type {(inputs: Login_Phone_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`코드 재전송`)
};

/**
* | output |
* | --- |
* | "Resend Code" |
*
* @param {Login_Phone_ResendInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_resend = /** @type {((inputs?: Login_Phone_ResendInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_ResendInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_resend(inputs)
	if (locale === "es") return es_login_phone_resend(inputs)
	if (locale === "de") return de_login_phone_resend(inputs)
	if (locale === "ar") return ar_login_phone_resend(inputs)
	if (locale === "fr") return fr_login_phone_resend(inputs)
	return ko_login_phone_resend(inputs)
});
export { login_phone_resend as "login.phone.resend" }