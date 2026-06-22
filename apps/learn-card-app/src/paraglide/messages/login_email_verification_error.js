/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Verification_ErrorInputs */

const en_login_email_verification_error = /** @type {(inputs: Login_Email_Verification_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to verify code. Please try again.`)
};

const es_login_email_verification_error = /** @type {(inputs: Login_Email_Verification_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo verificar el código. Intenta de nuevo.`)
};

const fr_login_email_verification_error = /** @type {(inputs: Login_Email_Verification_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de vérifier le code. Veuillez réessayer.`)
};

const ar_login_email_verification_error = /** @type {(inputs: Login_Email_Verification_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر التحقق من الرمز. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Unable to verify code. Please try again." |
*
* @param {Login_Email_Verification_ErrorInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_email_verification_error = /** @type {((inputs?: Login_Email_Verification_ErrorInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Verification_ErrorInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_verification_error(inputs)
	if (locale === "es") return es_login_email_verification_error(inputs)
	if (locale === "fr") return fr_login_email_verification_error(inputs)
	return ar_login_email_verification_error(inputs)
});
export { login_email_verification_error as "login.email.verification.error" }