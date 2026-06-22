/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Toastgenericerror5Inputs */

const en_passport_buildmylearncard_managers_toastgenericerror5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastgenericerror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong`)
};

const es_passport_buildmylearncard_managers_toastgenericerror5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastgenericerror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algo salió mal`)
};

const fr_passport_buildmylearncard_managers_toastgenericerror5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastgenericerror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite`)
};

const ar_passport_buildmylearncard_managers_toastgenericerror5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastgenericerror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما`)
};

/**
* | output |
* | --- |
* | "Something went wrong" |
*
* @param {Passport_Buildmylearncard_Managers_Toastgenericerror5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_toastgenericerror5 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Toastgenericerror5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Toastgenericerror5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_toastgenericerror5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_toastgenericerror5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_toastgenericerror5(inputs)
	return ar_passport_buildmylearncard_managers_toastgenericerror5(inputs)
});
export { passport_buildmylearncard_managers_toastgenericerror5 as "passport.buildMyLearnCard.managers.toastGenericError" }