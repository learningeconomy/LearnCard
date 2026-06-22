/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Setprimaryconfirm_Text2Inputs */

const en_profile_email_setprimaryconfirm_text2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Text2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to set this email as primary?`)
};

const es_profile_email_setprimaryconfirm_text2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Text2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Está seguro de que desea configurar este correo electrónico como principal?`)
};

const fr_profile_email_setprimaryconfirm_text2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Text2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir définir cette adresse e-mail comme adresse principale ?`)
};

const ar_profile_email_setprimaryconfirm_text2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Text2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد تعيين هذا البريد الإلكتروني كبريد أساسي؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to set this email as primary?" |
*
* @param {Profile_Email_Setprimaryconfirm_Text2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_email_setprimaryconfirm_text2 = /** @type {((inputs?: Profile_Email_Setprimaryconfirm_Text2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Setprimaryconfirm_Text2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_setprimaryconfirm_text2(inputs)
	if (locale === "es") return es_profile_email_setprimaryconfirm_text2(inputs)
	if (locale === "fr") return fr_profile_email_setprimaryconfirm_text2(inputs)
	return ar_profile_email_setprimaryconfirm_text2(inputs)
});
export { profile_email_setprimaryconfirm_text2 as "profile.email.setPrimaryConfirm.text" }