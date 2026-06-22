/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_RemoveInputs */

const en_profile_email_remove = /** @type {(inputs: Profile_Email_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove`)
};

const es_profile_email_remove = /** @type {(inputs: Profile_Email_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_profile_email_remove = /** @type {(inputs: Profile_Email_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retirer`)
};

const ar_profile_email_remove = /** @type {(inputs: Profile_Email_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يزيل`)
};

/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Profile_Email_RemoveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_email_remove = /** @type {((inputs?: Profile_Email_RemoveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_RemoveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_remove(inputs)
	if (locale === "es") return es_profile_email_remove(inputs)
	if (locale === "fr") return fr_profile_email_remove(inputs)
	return ar_profile_email_remove(inputs)
});
export { profile_email_remove as "profile.email.remove" }