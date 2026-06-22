/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Family_Boostupdateerror2Inputs */

const en_toasts_family_boostupdateerror2 = /** @type {(inputs: Toasts_Family_Boostupdateerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error updating boost`)
};

const es_toasts_family_boostupdateerror2 = /** @type {(inputs: Toasts_Family_Boostupdateerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al actualizar boost`)
};

const fr_toasts_family_boostupdateerror2 = /** @type {(inputs: Toasts_Family_Boostupdateerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de la mise à jour du boost`)
};

const ar_toasts_family_boostupdateerror2 = /** @type {(inputs: Toasts_Family_Boostupdateerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في تحديث Boost`)
};

/**
* | output |
* | --- |
* | "Error updating boost" |
*
* @param {Toasts_Family_Boostupdateerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_family_boostupdateerror2 = /** @type {((inputs?: Toasts_Family_Boostupdateerror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Family_Boostupdateerror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_family_boostupdateerror2(inputs)
	if (locale === "es") return es_toasts_family_boostupdateerror2(inputs)
	if (locale === "fr") return fr_toasts_family_boostupdateerror2(inputs)
	return ar_toasts_family_boostupdateerror2(inputs)
});
export { toasts_family_boostupdateerror2 as "toasts.family.boostUpdateError" }