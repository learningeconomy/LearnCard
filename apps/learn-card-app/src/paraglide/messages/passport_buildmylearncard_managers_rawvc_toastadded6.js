/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Rawvc_Toastadded6Inputs */

const en_passport_buildmylearncard_managers_rawvc_toastadded6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastadded6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON Credential Successfully Added`)
};

const es_passport_buildmylearncard_managers_rawvc_toastadded6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastadded6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial JSON agregada con éxito`)
};

const fr_passport_buildmylearncard_managers_rawvc_toastadded6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastadded6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential JSON ajouté avec succès`)
};

const ar_passport_buildmylearncard_managers_rawvc_toastadded6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastadded6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إضافة شهادة الـ JSON بنجاح`)
};

/**
* | output |
* | --- |
* | "JSON Credential Successfully Added" |
*
* @param {Passport_Buildmylearncard_Managers_Rawvc_Toastadded6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_rawvc_toastadded6 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Rawvc_Toastadded6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Rawvc_Toastadded6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_rawvc_toastadded6(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_rawvc_toastadded6(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_rawvc_toastadded6(inputs)
	return ar_passport_buildmylearncard_managers_rawvc_toastadded6(inputs)
});
export { passport_buildmylearncard_managers_rawvc_toastadded6 as "passport.buildMyLearnCard.managers.rawVC.toastAdded" }