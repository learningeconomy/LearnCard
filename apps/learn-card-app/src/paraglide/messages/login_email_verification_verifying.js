/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Verification_VerifyingInputs */

const en_login_email_verification_verifying = /** @type {(inputs: Login_Email_Verification_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying...`)
};

const es_login_email_verification_verifying = /** @type {(inputs: Login_Email_Verification_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando...`)
};

const de_login_email_verification_verifying = /** @type {(inputs: Login_Email_Verification_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird überprüft...`)
};

const ar_login_email_verification_verifying = /** @type {(inputs: Login_Email_Verification_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحقق...`)
};

const fr_login_email_verification_verifying = /** @type {(inputs: Login_Email_Verification_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification...`)
};

const ko_login_email_verification_verifying = /** @type {(inputs: Login_Email_Verification_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인 중...`)
};

/**
* | output |
* | --- |
* | "Verifying..." |
*
* @param {Login_Email_Verification_VerifyingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_verification_verifying = /** @type {((inputs?: Login_Email_Verification_VerifyingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Verification_VerifyingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_verification_verifying(inputs)
	if (locale === "es") return es_login_email_verification_verifying(inputs)
	if (locale === "de") return de_login_email_verification_verifying(inputs)
	if (locale === "ar") return ar_login_email_verification_verifying(inputs)
	if (locale === "fr") return fr_login_email_verification_verifying(inputs)
	return ko_login_email_verification_verifying(inputs)
});
export { login_email_verification_verifying as "login.email.verification.verifying" }