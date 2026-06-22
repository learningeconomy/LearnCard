/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_UnverifiedInputs */

const en_profile_email_unverified = /** @type {(inputs: Profile_Email_UnverifiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unverified`)
};

const es_profile_email_unverified = /** @type {(inputs: Profile_Email_UnverifiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inconfirmado`)
};

const fr_profile_email_unverified = /** @type {(inputs: Profile_Email_UnverifiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non vérifié`)
};

const ar_profile_email_unverified = /** @type {(inputs: Profile_Email_UnverifiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم التحقق منها`)
};

/**
* | output |
* | --- |
* | "Unverified" |
*
* @param {Profile_Email_UnverifiedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_email_unverified = /** @type {((inputs?: Profile_Email_UnverifiedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_UnverifiedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_unverified(inputs)
	if (locale === "es") return es_profile_email_unverified(inputs)
	if (locale === "fr") return fr_profile_email_unverified(inputs)
	return ar_profile_email_unverified(inputs)
});
export { profile_email_unverified as "profile.email.unverified" }