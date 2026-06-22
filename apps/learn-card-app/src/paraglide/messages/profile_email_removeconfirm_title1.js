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

const fr_profile_email_removeconfirm_title1 = /** @type {(inputs: Profile_Email_Removeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer la méthode de contact`)
};

const ar_profile_email_removeconfirm_title1 = /** @type {(inputs: Profile_Email_Removeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة طريقة الاتصال`)
};

/**
* | output |
* | --- |
* | "Remove Contact Method" |
*
* @param {Profile_Email_Removeconfirm_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_email_removeconfirm_title1 = /** @type {((inputs?: Profile_Email_Removeconfirm_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Removeconfirm_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_removeconfirm_title1(inputs)
	if (locale === "es") return es_profile_email_removeconfirm_title1(inputs)
	if (locale === "fr") return fr_profile_email_removeconfirm_title1(inputs)
	return ar_profile_email_removeconfirm_title1(inputs)
});
export { profile_email_removeconfirm_title1 as "profile.email.removeConfirm.title" }