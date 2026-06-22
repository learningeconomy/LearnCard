/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Selectcredential1Inputs */

const en_toasts_selectcredential1 = /** @type {(inputs: Toasts_Selectcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select at least one credential to claim.`)
};

const es_toasts_selectcredential1 = /** @type {(inputs: Toasts_Selectcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona al menos una credencial para reclamar.`)
};

const fr_toasts_selectcredential1 = /** @type {(inputs: Toasts_Selectcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez sélectionner au moins une accréditation à réclamer.`)
};

const ar_toasts_selectcredential1 = /** @type {(inputs: Toasts_Selectcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى اختيار بيانات اعتماد واحدة على الأقل للمطالبة بها.`)
};

/**
* | output |
* | --- |
* | "Please select at least one credential to claim." |
*
* @param {Toasts_Selectcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_selectcredential1 = /** @type {((inputs?: Toasts_Selectcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Selectcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_selectcredential1(inputs)
	if (locale === "es") return es_toasts_selectcredential1(inputs)
	if (locale === "fr") return fr_toasts_selectcredential1(inputs)
	return ar_toasts_selectcredential1(inputs)
});
export { toasts_selectcredential1 as "toasts.selectCredential" }