/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Toasts_Addadminfail3Inputs */

const en_skillframeworks_toasts_addadminfail3 = /** @type {(inputs: Skillframeworks_Toasts_Addadminfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to add admin. Please check the Profile ID and try again.`)
};

const es_skillframeworks_toasts_addadminfail3 = /** @type {(inputs: Skillframeworks_Toasts_Addadminfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al añadir admin. Verifica el ID de Perfil e inténtalo de nuevo.`)
};

const fr_skillframeworks_toasts_addadminfail3 = /** @type {(inputs: Skillframeworks_Toasts_Addadminfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'ajout de l'administrateur. Veuillez vérifier l'ID de profil et réessayer.`)
};

const ar_skillframeworks_toasts_addadminfail3 = /** @type {(inputs: Skillframeworks_Toasts_Addadminfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إضافة المسؤول. يرجى التحقق من معرف الملف الشخصي والمحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to add admin. Please check the Profile ID and try again." |
*
* @param {Skillframeworks_Toasts_Addadminfail3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_toasts_addadminfail3 = /** @type {((inputs?: Skillframeworks_Toasts_Addadminfail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Toasts_Addadminfail3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_toasts_addadminfail3(inputs)
	if (locale === "es") return es_skillframeworks_toasts_addadminfail3(inputs)
	if (locale === "fr") return fr_skillframeworks_toasts_addadminfail3(inputs)
	return ar_skillframeworks_toasts_addadminfail3(inputs)
});
export { skillframeworks_toasts_addadminfail3 as "skillFrameworks.toasts.addAdminFail" }