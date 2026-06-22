/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Validation_Minchars2Inputs */

const en_createprofile_validation_minchars2 = /** @type {(inputs: Createprofile_Validation_Minchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must contain at least 3 character(s).`)
};

const es_createprofile_validation_minchars2 = /** @type {(inputs: Createprofile_Validation_Minchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Debe contener al menos 3 caracteres.`)
};

const fr_createprofile_validation_minchars2 = /** @type {(inputs: Createprofile_Validation_Minchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Doit contenir au moins 3 caractères.`)
};

const ar_createprofile_validation_minchars2 = /** @type {(inputs: Createprofile_Validation_Minchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يحتوي على 3 أحرف على الأقل.`)
};

/**
* | output |
* | --- |
* | "Must contain at least 3 character(s)." |
*
* @param {Createprofile_Validation_Minchars2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_validation_minchars2 = /** @type {((inputs?: Createprofile_Validation_Minchars2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Validation_Minchars2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_validation_minchars2(inputs)
	if (locale === "es") return es_createprofile_validation_minchars2(inputs)
	if (locale === "fr") return fr_createprofile_validation_minchars2(inputs)
	return ar_createprofile_validation_minchars2(inputs)
});
export { createprofile_validation_minchars2 as "createProfile.validation.minChars" }