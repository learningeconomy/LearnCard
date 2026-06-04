/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Profilepicture3Inputs */

const en_consentflow_credentialtype_profilepicture3 = /** @type {(inputs: Consentflow_Credentialtype_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile Picture`)
};

const es_consentflow_credentialtype_profilepicture3 = /** @type {(inputs: Consentflow_Credentialtype_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Foto de perfil`)
};

const de_consentflow_credentialtype_profilepicture3 = /** @type {(inputs: Consentflow_Credentialtype_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profilbild`)
};

const ar_consentflow_credentialtype_profilepicture3 = /** @type {(inputs: Consentflow_Credentialtype_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة الملف الشخصي`)
};

const fr_consentflow_credentialtype_profilepicture3 = /** @type {(inputs: Consentflow_Credentialtype_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Photo de profil`)
};

const ko_consentflow_credentialtype_profilepicture3 = /** @type {(inputs: Consentflow_Credentialtype_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 사진`)
};

/**
* | output |
* | --- |
* | "Profile Picture" |
*
* @param {Consentflow_Credentialtype_Profilepicture3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_profilepicture3 = /** @type {((inputs?: Consentflow_Credentialtype_Profilepicture3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Profilepicture3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_profilepicture3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_profilepicture3(inputs)
	if (locale === "de") return de_consentflow_credentialtype_profilepicture3(inputs)
	if (locale === "ar") return ar_consentflow_credentialtype_profilepicture3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_profilepicture3(inputs)
	return ko_consentflow_credentialtype_profilepicture3(inputs)
});
export { consentflow_credentialtype_profilepicture3 as "consentFlow.credentialType.profilePicture" }