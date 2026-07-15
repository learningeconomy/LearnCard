/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Toasts_Errorupdate2Inputs */

const en_skillframeworks_toasts_errorupdate2 = /** @type {(inputs: Skillframeworks_Toasts_Errorupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error updating skills:`)
};

const es_skillframeworks_toasts_errorupdate2 = /** @type {(inputs: Skillframeworks_Toasts_Errorupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al actualizar habilidades:`)
};

const fr_skillframeworks_toasts_errorupdate2 = /** @type {(inputs: Skillframeworks_Toasts_Errorupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de la mise à jour des compétences :`)
};

const ar_skillframeworks_toasts_errorupdate2 = /** @type {(inputs: Skillframeworks_Toasts_Errorupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في تحديث المهارات:`)
};

/**
* | output |
* | --- |
* | "Error updating skills:" |
*
* @param {Skillframeworks_Toasts_Errorupdate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_toasts_errorupdate2 = /** @type {((inputs?: Skillframeworks_Toasts_Errorupdate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Toasts_Errorupdate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_toasts_errorupdate2(inputs)
	if (locale === "es") return es_skillframeworks_toasts_errorupdate2(inputs)
	if (locale === "fr") return fr_skillframeworks_toasts_errorupdate2(inputs)
	return ar_skillframeworks_toasts_errorupdate2(inputs)
});
export { skillframeworks_toasts_errorupdate2 as "skillFrameworks.toasts.errorUpdate" }