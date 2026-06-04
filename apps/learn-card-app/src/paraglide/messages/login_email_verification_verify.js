/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Verification_VerifyInputs */

const en_login_email_verification_verify = /** @type {(inputs: Login_Email_Verification_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify`)
};

const es_login_email_verification_verify = /** @type {(inputs: Login_Email_Verification_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar`)
};

const de_login_email_verification_verify = /** @type {(inputs: Login_Email_Verification_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bestätigen`)
};

const ar_login_email_verification_verify = /** @type {(inputs: Login_Email_Verification_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق`)
};

const fr_login_email_verification_verify = /** @type {(inputs: Login_Email_Verification_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier`)
};

const ko_login_email_verification_verify = /** @type {(inputs: Login_Email_Verification_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인`)
};

/**
* | output |
* | --- |
* | "Verify" |
*
* @param {Login_Email_Verification_VerifyInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_verification_verify = /** @type {((inputs?: Login_Email_Verification_VerifyInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Email_Verification_VerifyInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_email_verification_verify(inputs)
	if (locale === "es") return es_login_email_verification_verify(inputs)
	if (locale === "de") return de_login_email_verification_verify(inputs)
	if (locale === "ar") return ar_login_email_verification_verify(inputs)
	if (locale === "fr") return fr_login_email_verification_verify(inputs)
	return ko_login_email_verification_verify(inputs)
});
export { login_email_verification_verify as "login.email.verification.verify" }