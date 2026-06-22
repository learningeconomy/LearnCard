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

const fr_profile_email_noemails1 = /** @type {(inputs: Profile_Email_Noemails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun e-mail ajouté pour l'instant.`)
};

const ar_profile_email_noemails1 = /** @type {(inputs: Profile_Email_Noemails1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة أي رسائل بريد إلكتروني حتى الآن.`)
};

/**
* | output |
* | --- |
* | "No emails added yet." |
*
* @param {Profile_Email_Noemails1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_email_noemails1 = /** @type {((inputs?: Profile_Email_Noemails1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Email_Noemails1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_email_noemails1(inputs)
	if (locale === "es") return es_profile_email_noemails1(inputs)
	if (locale === "fr") return fr_profile_email_noemails1(inputs)
	return ar_profile_email_noemails1(inputs)
});
export { profile_email_noemails1 as "profile.email.noEmails" }