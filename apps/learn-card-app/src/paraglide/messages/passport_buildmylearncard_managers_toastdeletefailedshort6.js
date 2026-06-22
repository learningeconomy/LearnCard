/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Toastdeletefailedshort6Inputs */

const en_passport_buildmylearncard_managers_toastdeletefailedshort6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastdeletefailedshort6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete failed`)
};

const es_passport_buildmylearncard_managers_toastdeletefailedshort6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastdeletefailedshort6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al eliminar`)
};

const fr_passport_buildmylearncard_managers_toastdeletefailedshort6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastdeletefailedshort6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la suppression`)
};

const ar_passport_buildmylearncard_managers_toastdeletefailedshort6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastdeletefailedshort6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل الحذف`)
};

/**
* | output |
* | --- |
* | "Delete failed" |
*
* @param {Passport_Buildmylearncard_Managers_Toastdeletefailedshort6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_toastdeletefailedshort6 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Toastdeletefailedshort6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Toastdeletefailedshort6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_toastdeletefailedshort6(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_toastdeletefailedshort6(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_toastdeletefailedshort6(inputs)
	return ar_passport_buildmylearncard_managers_toastdeletefailedshort6(inputs)
});
export { passport_buildmylearncard_managers_toastdeletefailedshort6 as "passport.buildMyLearnCard.managers.toastDeleteFailedShort" }