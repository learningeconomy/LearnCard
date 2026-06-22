/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_PlaceholderInputs */

const en_profile_email_placeholder = /** @type {(inputs: Profile_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email`)
};

const es_profile_email_placeholder = /** @type {(inputs: Profile_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo electrónico`)
};

const fr_profile_email_placeholder = /** @type {(inputs: Profile_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail`)
};

const ar_profile_email_placeholder = /** @type {(inputs: Profile_Email_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بريد إلكتروني`)
};

/**
* | output |
* | --- |
* | "Email" |
*
* @param {Profile_Email_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_email_placeholder = /** @type {((inputs?: Profile_Email_PlaceholderInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_PlaceholderInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_placeholder(inputs)
	if (locale === "es") return es_profile_email_placeholder(inputs)
	if (locale === "fr") return fr_profile_email_placeholder(inputs)
	return ar_profile_email_placeholder(inputs)
});
export { profile_email_placeholder as "profile.email.placeholder" }