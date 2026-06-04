/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_ResendInputs */

const en_login_email_resend = /** @type {(inputs: Login_Email_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resend Code`)
};

const es_login_email_resend = /** @type {(inputs: Login_Email_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reenviar código`)
};

const de_login_email_resend = /** @type {(inputs: Login_Email_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code erneut senden`)
};

const ar_login_email_resend = /** @type {(inputs: Login_Email_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة إرسال الرمز`)
};

const fr_login_email_resend = /** @type {(inputs: Login_Email_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renvoyer le code`)
};

const ko_login_email_resend = /** @type {(inputs: Login_Email_ResendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`코드 재전송`)
};

/**
* | output |
* | --- |
* | "Resend Code" |
*
* @param {Login_Email_ResendInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_resend = /** @type {((inputs?: Login_Email_ResendInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_ResendInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_resend(inputs)
	if (locale === "es") return es_login_email_resend(inputs)
	if (locale === "de") return de_login_email_resend(inputs)
	if (locale === "ar") return ar_login_email_resend(inputs)
	if (locale === "fr") return fr_login_email_resend(inputs)
	return ko_login_email_resend(inputs)
});
export { login_email_resend as "login.email.resend" }