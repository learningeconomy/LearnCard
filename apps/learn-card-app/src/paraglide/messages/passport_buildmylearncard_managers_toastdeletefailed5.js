/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Toastdeletefailed5Inputs */

const en_passport_buildmylearncard_managers_toastdeletefailed5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastdeletefailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to delete. Please try again.`)
};

const es_passport_buildmylearncard_managers_toastdeletefailed5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastdeletefailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo eliminar. Inténtalo de nuevo.`)
};

const fr_passport_buildmylearncard_managers_toastdeletefailed5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastdeletefailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la suppression. Veuillez réessayer.`)
};

const ar_passport_buildmylearncard_managers_toastdeletefailed5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastdeletefailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر الحذف. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to delete. Please try again." |
*
* @param {Passport_Buildmylearncard_Managers_Toastdeletefailed5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_toastdeletefailed5 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Toastdeletefailed5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Toastdeletefailed5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_toastdeletefailed5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_toastdeletefailed5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_toastdeletefailed5(inputs)
	return ar_passport_buildmylearncard_managers_toastdeletefailed5(inputs)
});
export { passport_buildmylearncard_managers_toastdeletefailed5 as "passport.buildMyLearnCard.managers.toastDeleteFailed" }