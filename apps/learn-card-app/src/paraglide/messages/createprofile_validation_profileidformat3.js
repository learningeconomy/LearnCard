/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Validation_Profileidformat3Inputs */

const en_createprofile_validation_profileidformat3 = /** @type {(inputs: Createprofile_Validation_Profileidformat3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alphanumeric characters and dashes '-' only, no spaces allowed.`)
};

const es_createprofile_validation_profileidformat3 = /** @type {(inputs: Createprofile_Validation_Profileidformat3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo caracteres alfanuméricos y guiones '-', sin espacios.`)
};

const fr_createprofile_validation_profileidformat3 = /** @type {(inputs: Createprofile_Validation_Profileidformat3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Caractères alphanumériques et tirets '-' uniquement, espaces non autorisés.`)
};

const ar_createprofile_validation_profileidformat3 = /** @type {(inputs: Createprofile_Validation_Profileidformat3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أحرف وأرقام وشرطات '-' فقط، بدون مسافات.`)
};

/**
* | output |
* | --- |
* | "Alphanumeric characters and dashes '-' only, no spaces allowed." |
*
* @param {Createprofile_Validation_Profileidformat3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_validation_profileidformat3 = /** @type {((inputs?: Createprofile_Validation_Profileidformat3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Validation_Profileidformat3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_validation_profileidformat3(inputs)
	if (locale === "es") return es_createprofile_validation_profileidformat3(inputs)
	if (locale === "fr") return fr_createprofile_validation_profileidformat3(inputs)
	return ar_createprofile_validation_profileidformat3(inputs)
});
export { createprofile_validation_profileidformat3 as "createProfile.validation.profileIdFormat" }