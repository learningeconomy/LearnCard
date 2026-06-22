/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Toasts_General_Somethingwentwrong2Inputs */

const en_toasts_general_somethingwentwrong2 = /** @type {(inputs: Toasts_General_Somethingwentwrong2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Something went wrong: ${i?.error}`)
};

const es_toasts_general_somethingwentwrong2 = /** @type {(inputs: Toasts_General_Somethingwentwrong2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Algo salió mal: ${i?.error}`)
};

const fr_toasts_general_somethingwentwrong2 = /** @type {(inputs: Toasts_General_Somethingwentwrong2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Quelque chose s'est mal passé : ${i?.error}`)
};

const ar_toasts_general_somethingwentwrong2 = /** @type {(inputs: Toasts_General_Somethingwentwrong2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Something went wrong: {error}" |
*
* @param {Toasts_General_Somethingwentwrong2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_general_somethingwentwrong2 = /** @type {((inputs: Toasts_General_Somethingwentwrong2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_General_Somethingwentwrong2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_general_somethingwentwrong2(inputs)
	if (locale === "es") return es_toasts_general_somethingwentwrong2(inputs)
	if (locale === "fr") return fr_toasts_general_somethingwentwrong2(inputs)
	return ar_toasts_general_somethingwentwrong2(inputs)
});
export { toasts_general_somethingwentwrong2 as "toasts.general.somethingWentWrong" }