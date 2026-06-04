/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Removeconfirm_Title1Inputs */

const en_profile_email_removeconfirm_title1 = /** @type {(inputs: Profile_Email_Removeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove Contact Method`)
};

const es_profile_email_removeconfirm_title1 = /** @type {(inputs: Profile_Email_Removeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar método de contacto`)
};

const de_profile_email_removeconfirm_title1 = /** @type {(inputs: Profile_Email_Removeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontaktmethode entfernen`)
};

const ar_profile_email_removeconfirm_title1 = /** @type {(inputs: Profile_Email_Removeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة طريقة الاتصال`)
};

const fr_profile_email_removeconfirm_title1 = /** @type {(inputs: Profile_Email_Removeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer la méthode de contact`)
};

const ko_profile_email_removeconfirm_title1 = /** @type {(inputs: Profile_Email_Removeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락 방법 삭제`)
};

/**
* | output |
* | --- |
* | "Remove Contact Method" |
*
* @param {Profile_Email_Removeconfirm_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_removeconfirm_title1 = /** @type {((inputs?: Profile_Email_Removeconfirm_Title1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Removeconfirm_Title1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_removeconfirm_title1(inputs)
	if (locale === "es") return es_profile_email_removeconfirm_title1(inputs)
	if (locale === "de") return de_profile_email_removeconfirm_title1(inputs)
	if (locale === "ar") return ar_profile_email_removeconfirm_title1(inputs)
	if (locale === "fr") return fr_profile_email_removeconfirm_title1(inputs)
	return ko_profile_email_removeconfirm_title1(inputs)
});
export { profile_email_removeconfirm_title1 as "profile.email.removeConfirm.title" }