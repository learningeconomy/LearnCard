/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Validation_Namemaxchars3Inputs */

const en_createprofile_validation_namemaxchars3 = /** @type {(inputs: Createprofile_Validation_Namemaxchars3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must contain at most 30 character(s).`)
};

const es_createprofile_validation_namemaxchars3 = /** @type {(inputs: Createprofile_Validation_Namemaxchars3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Debe contener como máximo 30 caracteres.`)
};

const fr_createprofile_validation_namemaxchars3 = /** @type {(inputs: Createprofile_Validation_Namemaxchars3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Doit contenir au maximum 30 caractères.`)
};

const ar_createprofile_validation_namemaxchars3 = /** @type {(inputs: Createprofile_Validation_Namemaxchars3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يحتوي على 30 حرفًا كحد أقصى.`)
};

/**
* | output |
* | --- |
* | "Must contain at most 30 character(s)." |
*
* @param {Createprofile_Validation_Namemaxchars3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_validation_namemaxchars3 = /** @type {((inputs?: Createprofile_Validation_Namemaxchars3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Validation_Namemaxchars3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_validation_namemaxchars3(inputs)
	if (locale === "es") return es_createprofile_validation_namemaxchars3(inputs)
	if (locale === "fr") return fr_createprofile_validation_namemaxchars3(inputs)
	return ar_createprofile_validation_namemaxchars3(inputs)
});
export { createprofile_validation_namemaxchars3 as "createProfile.validation.nameMaxChars" }