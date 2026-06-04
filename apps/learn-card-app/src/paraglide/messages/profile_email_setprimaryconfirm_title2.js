/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Setprimaryconfirm_Title2Inputs */

const en_profile_email_setprimaryconfirm_title2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set Primary Contact Method`)
};

const es_profile_email_setprimaryconfirm_title2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Establecer método de contacto principal`)
};

const de_profile_email_setprimaryconfirm_title2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Legen Sie die primäre Kontaktmethode fest`)
};

const ar_profile_email_setprimaryconfirm_title2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتعيين طريقة الاتصال الأساسية`)
};

const fr_profile_email_setprimaryconfirm_title2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir la méthode de contact principal`)
};

const ko_profile_email_setprimaryconfirm_title2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기본 연락 방법 설정`)
};

/**
* | output |
* | --- |
* | "Set Primary Contact Method" |
*
* @param {Profile_Email_Setprimaryconfirm_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_setprimaryconfirm_title2 = /** @type {((inputs?: Profile_Email_Setprimaryconfirm_Title2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Setprimaryconfirm_Title2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_setprimaryconfirm_title2(inputs)
	if (locale === "es") return es_profile_email_setprimaryconfirm_title2(inputs)
	if (locale === "de") return de_profile_email_setprimaryconfirm_title2(inputs)
	if (locale === "ar") return ar_profile_email_setprimaryconfirm_title2(inputs)
	if (locale === "fr") return fr_profile_email_setprimaryconfirm_title2(inputs)
	return ko_profile_email_setprimaryconfirm_title2(inputs)
});
export { profile_email_setprimaryconfirm_title2 as "profile.email.setPrimaryConfirm.title" }