/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Toasts_General_Failedtoupdateterms3Inputs */

const en_toasts_general_failedtoupdateterms3 = /** @type {(inputs: Toasts_General_Failedtoupdateterms3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to update terms: ${i?.error}`)
};

const es_toasts_general_failedtoupdateterms3 = /** @type {(inputs: Toasts_General_Failedtoupdateterms3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al actualizar los términos: ${i?.error}`)
};

const de_toasts_general_failedtoupdateterms3 = /** @type {(inputs: Toasts_General_Failedtoupdateterms3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Bedingungen konnten nicht aktualisiert werden: ${i?.error}`)
};

const ar_toasts_general_failedtoupdateterms3 = /** @type {(inputs: Toasts_General_Failedtoupdateterms3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فشل تحديث الشروط: ${i?.error}`)
};

const fr_toasts_general_failedtoupdateterms3 = /** @type {(inputs: Toasts_General_Failedtoupdateterms3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour des conditions : ${i?.error}`)
};

const ko_toasts_general_failedtoupdateterms3 = /** @type {(inputs: Toasts_General_Failedtoupdateterms3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`약관 업데이트 실패: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Failed to update terms: {error}" |
*
* @param {Toasts_General_Failedtoupdateterms3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_general_failedtoupdateterms3 = /** @type {((inputs: Toasts_General_Failedtoupdateterms3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_General_Failedtoupdateterms3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_general_failedtoupdateterms3(inputs)
	if (locale === "es") return es_toasts_general_failedtoupdateterms3(inputs)
	if (locale === "de") return de_toasts_general_failedtoupdateterms3(inputs)
	if (locale === "ar") return ar_toasts_general_failedtoupdateterms3(inputs)
	if (locale === "fr") return fr_toasts_general_failedtoupdateterms3(inputs)
	return ko_toasts_general_failedtoupdateterms3(inputs)
});
export { toasts_general_failedtoupdateterms3 as "toasts.general.failedToUpdateTerms" }