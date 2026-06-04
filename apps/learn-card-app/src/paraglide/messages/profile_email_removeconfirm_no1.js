/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Removeconfirm_No1Inputs */

const en_profile_email_removeconfirm_no1 = /** @type {(inputs: Profile_Email_Removeconfirm_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No`)
};

const es_profile_email_removeconfirm_no1 = /** @type {(inputs: Profile_Email_Removeconfirm_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No`)
};

const de_profile_email_removeconfirm_no1 = /** @type {(inputs: Profile_Email_Removeconfirm_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nein`)
};

const ar_profile_email_removeconfirm_no1 = /** @type {(inputs: Profile_Email_Removeconfirm_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا`)
};

const fr_profile_email_removeconfirm_no1 = /** @type {(inputs: Profile_Email_Removeconfirm_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non`)
};

const ko_profile_email_removeconfirm_no1 = /** @type {(inputs: Profile_Email_Removeconfirm_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아니요`)
};

/**
* | output |
* | --- |
* | "No" |
*
* @param {Profile_Email_Removeconfirm_No1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_removeconfirm_no1 = /** @type {((inputs?: Profile_Email_Removeconfirm_No1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Removeconfirm_No1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_removeconfirm_no1(inputs)
	if (locale === "es") return es_profile_email_removeconfirm_no1(inputs)
	if (locale === "de") return de_profile_email_removeconfirm_no1(inputs)
	if (locale === "ar") return ar_profile_email_removeconfirm_no1(inputs)
	if (locale === "fr") return fr_profile_email_removeconfirm_no1(inputs)
	return ko_profile_email_removeconfirm_no1(inputs)
});
export { profile_email_removeconfirm_no1 as "profile.email.removeConfirm.no" }