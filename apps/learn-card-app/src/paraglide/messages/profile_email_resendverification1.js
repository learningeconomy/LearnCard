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

const fr_profile_email_resendverification1 = /** @type {(inputs: Profile_Email_Resendverification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renvoyer l'e-mail de vérification`)
};

const ar_profile_email_resendverification1 = /** @type {(inputs: Profile_Email_Resendverification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة إرسال البريد الإلكتروني للتحقق`)
};

/**
* | output |
* | --- |
* | "Resend verification email" |
*
* @param {Profile_Email_Resendverification1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_email_resendverification1 = /** @type {((inputs?: Profile_Email_Resendverification1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Resendverification1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_resendverification1(inputs)
	if (locale === "es") return es_profile_email_resendverification1(inputs)
	if (locale === "fr") return fr_profile_email_resendverification1(inputs)
	return ar_profile_email_resendverification1(inputs)
});
export { profile_email_resendverification1 as "profile.email.resendVerification" }