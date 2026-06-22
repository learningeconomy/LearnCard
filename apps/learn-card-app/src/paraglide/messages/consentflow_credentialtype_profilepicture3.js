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

const fr_consentflow_credentialtype_profilepicture3 = /** @type {(inputs: Consentflow_Credentialtype_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Photo de profil`)
};

const ar_consentflow_credentialtype_profilepicture3 = /** @type {(inputs: Consentflow_Credentialtype_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Profile Picture" |
*
* @param {Consentflow_Credentialtype_Profilepicture3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_profilepicture3 = /** @type {((inputs?: Consentflow_Credentialtype_Profilepicture3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Profilepicture3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_profilepicture3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_profilepicture3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_profilepicture3(inputs)
	return ar_consentflow_credentialtype_profilepicture3(inputs)
});
export { consentflow_credentialtype_profilepicture3 as "consentFlow.credentialType.profilePicture" }