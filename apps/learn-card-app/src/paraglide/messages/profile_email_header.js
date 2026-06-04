/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_HeaderInputs */

const en_profile_email_header = /** @type {(inputs: Profile_Email_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Addresses`)
};

const es_profile_email_header = /** @type {(inputs: Profile_Email_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Direcciones de correo electrónico`)
};

const de_profile_email_header = /** @type {(inputs: Profile_Email_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-Mail-Adressen`)
};

const ar_profile_email_header = /** @type {(inputs: Profile_Email_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عناوين البريد الإلكتروني`)
};

const fr_profile_email_header = /** @type {(inputs: Profile_Email_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adresses e-mail`)
};

const ko_profile_email_header = /** @type {(inputs: Profile_Email_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일 주소`)
};

/**
* | output |
* | --- |
* | "Email Addresses" |
*
* @param {Profile_Email_HeaderInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_header = /** @type {((inputs?: Profile_Email_HeaderInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_HeaderInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_header(inputs)
	if (locale === "es") return es_profile_email_header(inputs)
	if (locale === "de") return de_profile_email_header(inputs)
	if (locale === "ar") return ar_profile_email_header(inputs)
	if (locale === "fr") return fr_profile_email_header(inputs)
	return ko_profile_email_header(inputs)
});
export { profile_email_header as "profile.email.header" }