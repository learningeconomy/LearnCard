/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Resendverification1Inputs */

const en_profile_email_resendverification1 = /** @type {(inputs: Profile_Email_Resendverification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resend verification email`)
};

const es_profile_email_resendverification1 = /** @type {(inputs: Profile_Email_Resendverification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reenviar correo electrónico de verificación`)
};

const de_profile_email_resendverification1 = /** @type {(inputs: Profile_Email_Resendverification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bestätigungs-E-Mail erneut senden`)
};

const ar_profile_email_resendverification1 = /** @type {(inputs: Profile_Email_Resendverification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة إرسال البريد الإلكتروني للتحقق`)
};

const fr_profile_email_resendverification1 = /** @type {(inputs: Profile_Email_Resendverification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renvoyer l'e-mail de vérification`)
};

const ko_profile_email_resendverification1 = /** @type {(inputs: Profile_Email_Resendverification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인 이메일 다시 보내기`)
};

/**
* | output |
* | --- |
* | "Resend verification email" |
*
* @param {Profile_Email_Resendverification1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_resendverification1 = /** @type {((inputs?: Profile_Email_Resendverification1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Resendverification1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_resendverification1(inputs)
	if (locale === "es") return es_profile_email_resendverification1(inputs)
	if (locale === "de") return de_profile_email_resendverification1(inputs)
	if (locale === "ar") return ar_profile_email_resendverification1(inputs)
	if (locale === "fr") return fr_profile_email_resendverification1(inputs)
	return ko_profile_email_resendverification1(inputs)
});
export { profile_email_resendverification1 as "profile.email.resendVerification" }