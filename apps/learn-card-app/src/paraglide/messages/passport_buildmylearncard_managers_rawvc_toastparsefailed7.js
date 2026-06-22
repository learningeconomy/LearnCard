/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Rawvc_Toastparsefailed7Inputs */

const en_passport_buildmylearncard_managers_rawvc_toastparsefailed7 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastparsefailed7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to parse JSON VC.`)
};

const es_passport_buildmylearncard_managers_rawvc_toastparsefailed7 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastparsefailed7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo analizar la VC JSON.`)
};

const fr_passport_buildmylearncard_managers_rawvc_toastparsefailed7 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastparsefailed7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'analyse du VC JSON.`)
};

const ar_passport_buildmylearncard_managers_rawvc_toastparsefailed7 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastparsefailed7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر تحليل شهادة الـ JSON.`)
};

/**
* | output |
* | --- |
* | "Failed to parse JSON VC." |
*
* @param {Passport_Buildmylearncard_Managers_Rawvc_Toastparsefailed7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_rawvc_toastparsefailed7 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Rawvc_Toastparsefailed7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Rawvc_Toastparsefailed7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_rawvc_toastparsefailed7(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_rawvc_toastparsefailed7(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_rawvc_toastparsefailed7(inputs)
	return ar_passport_buildmylearncard_managers_rawvc_toastparsefailed7(inputs)
});
export { passport_buildmylearncard_managers_rawvc_toastparsefailed7 as "passport.buildMyLearnCard.managers.rawVC.toastParseFailed" }