/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Phonenumber2Inputs */

const en_userprofile_phonenumber2 = /** @type {(inputs: Userprofile_Phonenumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone Number`)
};

const es_userprofile_phonenumber2 = /** @type {(inputs: Userprofile_Phonenumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de Teléfono`)
};

const fr_userprofile_phonenumber2 = /** @type {(inputs: Userprofile_Phonenumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de téléphone`)
};

const ar_userprofile_phonenumber2 = /** @type {(inputs: Userprofile_Phonenumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم الهاتف`)
};

/**
* | output |
* | --- |
* | "Phone Number" |
*
* @param {Userprofile_Phonenumber2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_phonenumber2 = /** @type {((inputs?: Userprofile_Phonenumber2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Phonenumber2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_phonenumber2(inputs)
	if (locale === "es") return es_userprofile_phonenumber2(inputs)
	if (locale === "fr") return fr_userprofile_phonenumber2(inputs)
	return ar_userprofile_phonenumber2(inputs)
});
export { userprofile_phonenumber2 as "userProfile.phoneNumber" }