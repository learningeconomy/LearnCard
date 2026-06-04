/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_PrimaryInputs */

const en_profile_email_primary = /** @type {(inputs: Profile_Email_PrimaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Primary`)
};

const es_profile_email_primary = /** @type {(inputs: Profile_Email_PrimaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Primario`)
};

const de_profile_email_primary = /** @type {(inputs: Profile_Email_PrimaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Primär`)
};

const ar_profile_email_primary = /** @type {(inputs: Profile_Email_PrimaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أساسي`)
};

const fr_profile_email_primary = /** @type {(inputs: Profile_Email_PrimaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Primaire`)
};

const ko_profile_email_primary = /** @type {(inputs: Profile_Email_PrimaryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`주요한`)
};

/**
* | output |
* | --- |
* | "Primary" |
*
* @param {Profile_Email_PrimaryInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_primary = /** @type {((inputs?: Profile_Email_PrimaryInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_PrimaryInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_primary(inputs)
	if (locale === "es") return es_profile_email_primary(inputs)
	if (locale === "de") return de_profile_email_primary(inputs)
	if (locale === "ar") return ar_profile_email_primary(inputs)
	if (locale === "fr") return fr_profile_email_primary(inputs)
	return ko_profile_email_primary(inputs)
});
export { profile_email_primary as "profile.email.primary" }