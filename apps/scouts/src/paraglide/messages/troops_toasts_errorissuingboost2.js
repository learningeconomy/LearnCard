/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Toasts_Errorissuingboost2Inputs */

const en_troops_toasts_errorissuingboost2 = /** @type {(inputs: Troops_Toasts_Errorissuingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error issuing boost`)
};

const es_troops_toasts_errorissuingboost2 = /** @type {(inputs: Troops_Toasts_Errorissuingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al emitir boost`)
};

const fr_troops_toasts_errorissuingboost2 = /** @type {(inputs: Troops_Toasts_Errorissuingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de la délivrance du Boost`)
};

const ar_troops_toasts_errorissuingboost2 = /** @type {(inputs: Troops_Toasts_Errorissuingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في إصدار التعزيز`)
};

/**
* | output |
* | --- |
* | "Error issuing boost" |
*
* @param {Troops_Toasts_Errorissuingboost2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_toasts_errorissuingboost2 = /** @type {((inputs?: Troops_Toasts_Errorissuingboost2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Toasts_Errorissuingboost2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_toasts_errorissuingboost2(inputs)
	if (locale === "es") return es_troops_toasts_errorissuingboost2(inputs)
	if (locale === "fr") return fr_troops_toasts_errorissuingboost2(inputs)
	return ar_troops_toasts_errorissuingboost2(inputs)
});
export { troops_toasts_errorissuingboost2 as "troops.toasts.errorIssuingBoost" }