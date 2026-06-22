/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Validation_Profileidmaxchars4Inputs */

const en_createprofile_validation_profileidmaxchars4 = /** @type {(inputs: Createprofile_Validation_Profileidmaxchars4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must contain at most 25 character(s).`)
};

const es_createprofile_validation_profileidmaxchars4 = /** @type {(inputs: Createprofile_Validation_Profileidmaxchars4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Debe contener como máximo 25 caracteres.`)
};

const fr_createprofile_validation_profileidmaxchars4 = /** @type {(inputs: Createprofile_Validation_Profileidmaxchars4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Doit contenir au maximum 25 caractères.`)
};

const ar_createprofile_validation_profileidmaxchars4 = /** @type {(inputs: Createprofile_Validation_Profileidmaxchars4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يحتوي على 25 حرفًا كحد أقصى.`)
};

/**
* | output |
* | --- |
* | "Must contain at most 25 character(s)." |
*
* @param {Createprofile_Validation_Profileidmaxchars4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_validation_profileidmaxchars4 = /** @type {((inputs?: Createprofile_Validation_Profileidmaxchars4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Validation_Profileidmaxchars4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_validation_profileidmaxchars4(inputs)
	if (locale === "es") return es_createprofile_validation_profileidmaxchars4(inputs)
	if (locale === "fr") return fr_createprofile_validation_profileidmaxchars4(inputs)
	return ar_createprofile_validation_profileidmaxchars4(inputs)
});
export { createprofile_validation_profileidmaxchars4 as "createProfile.validation.profileIdMaxChars" }