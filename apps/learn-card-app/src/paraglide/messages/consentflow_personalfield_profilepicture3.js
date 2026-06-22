/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Personalfield_Profilepicture3Inputs */

const en_consentflow_personalfield_profilepicture3 = /** @type {(inputs: Consentflow_Personalfield_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`profile picture`)
};

const es_consentflow_personalfield_profilepicture3 = /** @type {(inputs: Consentflow_Personalfield_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`foto de perfil`)
};

const fr_consentflow_personalfield_profilepicture3 = /** @type {(inputs: Consentflow_Personalfield_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`photo de profil`)
};

const ar_consentflow_personalfield_profilepicture3 = /** @type {(inputs: Consentflow_Personalfield_Profilepicture3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "profile picture" |
*
* @param {Consentflow_Personalfield_Profilepicture3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_personalfield_profilepicture3 = /** @type {((inputs?: Consentflow_Personalfield_Profilepicture3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Personalfield_Profilepicture3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_personalfield_profilepicture3(inputs)
	if (locale === "es") return es_consentflow_personalfield_profilepicture3(inputs)
	if (locale === "fr") return fr_consentflow_personalfield_profilepicture3(inputs)
	return ar_consentflow_personalfield_profilepicture3(inputs)
});
export { consentflow_personalfield_profilepicture3 as "consentFlow.personalField.profilePicture" }