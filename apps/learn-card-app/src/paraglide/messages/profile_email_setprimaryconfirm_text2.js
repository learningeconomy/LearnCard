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

const de_profile_email_setprimaryconfirm_text2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Text2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sind Sie sicher, dass Sie diese E-Mail-Adresse als primäre E-Mail-Adresse festlegen möchten?`)
};

const ar_profile_email_setprimaryconfirm_text2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Text2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد تعيين هذا البريد الإلكتروني كبريد أساسي؟`)
};

const fr_profile_email_setprimaryconfirm_text2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Text2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir définir cette adresse e-mail comme adresse principale ?`)
};

const ko_profile_email_setprimaryconfirm_text2 = /** @type {(inputs: Profile_Email_Setprimaryconfirm_Text2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 이메일을 기본 이메일로 설정하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to set this email as primary?" |
*
* @param {Profile_Email_Setprimaryconfirm_Text2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_setprimaryconfirm_text2 = /** @type {((inputs?: Profile_Email_Setprimaryconfirm_Text2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Setprimaryconfirm_Text2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_setprimaryconfirm_text2(inputs)
	if (locale === "es") return es_profile_email_setprimaryconfirm_text2(inputs)
	if (locale === "de") return de_profile_email_setprimaryconfirm_text2(inputs)
	if (locale === "ar") return ar_profile_email_setprimaryconfirm_text2(inputs)
	if (locale === "fr") return fr_profile_email_setprimaryconfirm_text2(inputs)
	return ko_profile_email_setprimaryconfirm_text2(inputs)
});
export { profile_email_setprimaryconfirm_text2 as "profile.email.setPrimaryConfirm.text" }