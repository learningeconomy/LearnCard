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

const de_toasts_general_somethingwentwrong2 = /** @type {(inputs: Toasts_General_Somethingwentwrong2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Etwas ist schiefgelaufen: ${i?.error}`)
};

const ar_toasts_general_somethingwentwrong2 = /** @type {(inputs: Toasts_General_Somethingwentwrong2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما: ${i?.error}`)
};

const fr_toasts_general_somethingwentwrong2 = /** @type {(inputs: Toasts_General_Somethingwentwrong2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Quelque chose s'est mal passé : ${i?.error}`)
};

const ko_toasts_general_somethingwentwrong2 = /** @type {(inputs: Toasts_General_Somethingwentwrong2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`문제가 발생했습니다: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Something went wrong: {error}" |
*
* @param {Toasts_General_Somethingwentwrong2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_general_somethingwentwrong2 = /** @type {((inputs: Toasts_General_Somethingwentwrong2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_General_Somethingwentwrong2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_general_somethingwentwrong2(inputs)
	if (locale === "es") return es_toasts_general_somethingwentwrong2(inputs)
	if (locale === "de") return de_toasts_general_somethingwentwrong2(inputs)
	if (locale === "ar") return ar_toasts_general_somethingwentwrong2(inputs)
	if (locale === "fr") return fr_toasts_general_somethingwentwrong2(inputs)
	return ko_toasts_general_somethingwentwrong2(inputs)
});
export { toasts_general_somethingwentwrong2 as "toasts.general.somethingWentWrong" }