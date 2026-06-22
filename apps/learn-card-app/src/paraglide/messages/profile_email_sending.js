/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_SendingInputs */

const en_profile_email_sending = /** @type {(inputs: Profile_Email_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_profile_email_sending = /** @type {(inputs: Profile_Email_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envío...`)
};

const fr_profile_email_sending = /** @type {(inputs: Profile_Email_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi...`)
};

const ar_profile_email_sending = /** @type {(inputs: Profile_Email_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Profile_Email_SendingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_email_sending = /** @type {((inputs?: Profile_Email_SendingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_SendingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_sending(inputs)
	if (locale === "es") return es_profile_email_sending(inputs)
	if (locale === "fr") return fr_profile_email_sending(inputs)
	return ar_profile_email_sending(inputs)
});
export { profile_email_sending as "profile.email.sending" }