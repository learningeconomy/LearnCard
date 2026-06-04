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

const de_profile_email_remove = /** @type {(inputs: Profile_Email_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entfernen`)
};

const ar_profile_email_remove = /** @type {(inputs: Profile_Email_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يزيل`)
};

const fr_profile_email_remove = /** @type {(inputs: Profile_Email_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retirer`)
};

const ko_profile_email_remove = /** @type {(inputs: Profile_Email_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`제거하다`)
};

/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Profile_Email_RemoveInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_remove = /** @type {((inputs?: Profile_Email_RemoveInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_RemoveInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_remove(inputs)
	if (locale === "es") return es_profile_email_remove(inputs)
	if (locale === "de") return de_profile_email_remove(inputs)
	if (locale === "ar") return ar_profile_email_remove(inputs)
	if (locale === "fr") return fr_profile_email_remove(inputs)
	return ko_profile_email_remove(inputs)
});
export { profile_email_remove as "profile.email.remove" }