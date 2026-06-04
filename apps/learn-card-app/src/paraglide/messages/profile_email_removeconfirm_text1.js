/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Removeconfirm_Text1Inputs */

const en_profile_email_removeconfirm_text1 = /** @type {(inputs: Profile_Email_Removeconfirm_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove this email?`)
};

const es_profile_email_removeconfirm_text1 = /** @type {(inputs: Profile_Email_Removeconfirm_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas eliminar este correo electrónico?`)
};

const de_profile_email_removeconfirm_text1 = /** @type {(inputs: Profile_Email_Removeconfirm_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sind Sie sicher, dass Sie diese E-Mail entfernen möchten?`)
};

const ar_profile_email_removeconfirm_text1 = /** @type {(inputs: Profile_Email_Removeconfirm_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إزالة هذا البريد الإلكتروني؟`)
};

const fr_profile_email_removeconfirm_text1 = /** @type {(inputs: Profile_Email_Removeconfirm_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer cet e-mail ?`)
};

const ko_profile_email_removeconfirm_text1 = /** @type {(inputs: Profile_Email_Removeconfirm_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 이메일을 삭제하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to remove this email?" |
*
* @param {Profile_Email_Removeconfirm_Text1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_removeconfirm_text1 = /** @type {((inputs?: Profile_Email_Removeconfirm_Text1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Removeconfirm_Text1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_removeconfirm_text1(inputs)
	if (locale === "es") return es_profile_email_removeconfirm_text1(inputs)
	if (locale === "de") return de_profile_email_removeconfirm_text1(inputs)
	if (locale === "ar") return ar_profile_email_removeconfirm_text1(inputs)
	if (locale === "fr") return fr_profile_email_removeconfirm_text1(inputs)
	return ko_profile_email_removeconfirm_text1(inputs)
});
export { profile_email_removeconfirm_text1 as "profile.email.removeConfirm.text" }