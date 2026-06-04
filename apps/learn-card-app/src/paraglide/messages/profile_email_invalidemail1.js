/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Invalidemail1Inputs */

const en_profile_email_invalidemail1 = /** @type {(inputs: Profile_Email_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Missing or Invalid Email`)
};

const es_profile_email_invalidemail1 = /** @type {(inputs: Profile_Email_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo electrónico faltante o no válido`)
};

const de_profile_email_invalidemail1 = /** @type {(inputs: Profile_Email_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fehlende oder ungültige E-Mail`)
};

const ar_profile_email_invalidemail1 = /** @type {(inputs: Profile_Email_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البريد الإلكتروني مفقود أو غير صالح`)
};

const fr_profile_email_invalidemail1 = /** @type {(inputs: Profile_Email_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail manquant ou invalide`)
};

const ko_profile_email_invalidemail1 = /** @type {(inputs: Profile_Email_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일이 없거나 유효하지 않습니다.`)
};

/**
* | output |
* | --- |
* | "Missing or Invalid Email" |
*
* @param {Profile_Email_Invalidemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_invalidemail1 = /** @type {((inputs?: Profile_Email_Invalidemail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Invalidemail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_invalidemail1(inputs)
	if (locale === "es") return es_profile_email_invalidemail1(inputs)
	if (locale === "de") return de_profile_email_invalidemail1(inputs)
	if (locale === "ar") return ar_profile_email_invalidemail1(inputs)
	if (locale === "fr") return fr_profile_email_invalidemail1(inputs)
	return ko_profile_email_invalidemail1(inputs)
});
export { profile_email_invalidemail1 as "profile.email.invalidEmail" }