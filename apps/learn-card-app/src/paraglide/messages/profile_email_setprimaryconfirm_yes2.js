/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Setprimaryconfirm_Yes2Inputs */

const en_profile_email_setprimaryconfirm_yes2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Yes2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes`)
};

const es_profile_email_setprimaryconfirm_yes2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Yes2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí`)
};

const de_profile_email_setprimaryconfirm_yes2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Yes2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ja`)
};

const ar_profile_email_setprimaryconfirm_yes2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Yes2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نعم`)
};

const fr_profile_email_setprimaryconfirm_yes2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Yes2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui`)
};

const ko_profile_email_setprimaryconfirm_yes2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Yes2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`예`)
};

/**
* | output |
* | --- |
* | "Yes" |
*
* @param {Profile_Email_Setprimaryconfirm_Yes2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_setprimaryconfirm_yes2 = /** @type {((inputs?: Profile_Email_Setprimaryconfirm_Yes2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Setprimaryconfirm_Yes2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_setprimaryconfirm_yes2(inputs)
	if (locale === "es") return es_profile_email_setprimaryconfirm_yes2(inputs)
	if (locale === "de") return de_profile_email_setprimaryconfirm_yes2(inputs)
	if (locale === "ar") return ar_profile_email_setprimaryconfirm_yes2(inputs)
	if (locale === "fr") return fr_profile_email_setprimaryconfirm_yes2(inputs)
	return ko_profile_email_setprimaryconfirm_yes2(inputs)
});
export { profile_email_setprimaryconfirm_yes2 as "profile.email.setPrimaryConfirm.yes" }