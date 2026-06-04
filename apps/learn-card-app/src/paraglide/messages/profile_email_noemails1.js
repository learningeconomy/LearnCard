/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Email_Noemails1Inputs */

const en_profile_email_noemails1 = /** @type {(inputs: Profile_Email_Noemails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No emails added yet.`)
};

const es_profile_email_noemails1 = /** @type {(inputs: Profile_Email_Noemails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no se han agregado correos electrónicos.`)
};

const de_profile_email_noemails1 = /** @type {(inputs: Profile_Email_Noemails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine E-Mails hinzugefügt.`)
};

const ar_profile_email_noemails1 = /** @type {(inputs: Profile_Email_Noemails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة أي رسائل بريد إلكتروني حتى الآن.`)
};

const fr_profile_email_noemails1 = /** @type {(inputs: Profile_Email_Noemails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun e-mail ajouté pour l'instant.`)
};

const ko_profile_email_noemails1 = /** @type {(inputs: Profile_Email_Noemails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아직 추가된 이메일이 없습니다.`)
};

/**
* | output |
* | --- |
* | "No emails added yet." |
*
* @param {Profile_Email_Noemails1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_email_noemails1 = /** @type {((inputs?: Profile_Email_Noemails1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Noemails1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_noemails1(inputs)
	if (locale === "es") return es_profile_email_noemails1(inputs)
	if (locale === "de") return de_profile_email_noemails1(inputs)
	if (locale === "ar") return ar_profile_email_noemails1(inputs)
	if (locale === "fr") return fr_profile_email_noemails1(inputs)
	return ko_profile_email_noemails1(inputs)
});
export { profile_email_noemails1 as "profile.email.noEmails" }