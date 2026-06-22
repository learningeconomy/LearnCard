/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Selfissuefailed2Inputs */

const en_toasts_resume_selfissuefailed2 = /** @type {(inputs: Toasts_Resume_Selfissuefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to self issue credential`)
};

const es_toasts_resume_selfissuefailed2 = /** @type {(inputs: Toasts_Resume_Selfissuefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo emitir la credencial`)
};

const fr_toasts_resume_selfissuefailed2 = /** @type {(inputs: Toasts_Resume_Selfissuefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'auto-émettre l'accréditation`)
};

const ar_toasts_resume_selfissuefailed2 = /** @type {(inputs: Toasts_Resume_Selfissuefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر الإصدار الذاتي لبيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Unable to self issue credential" |
*
* @param {Toasts_Resume_Selfissuefailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_selfissuefailed2 = /** @type {((inputs?: Toasts_Resume_Selfissuefailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Selfissuefailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_selfissuefailed2(inputs)
	if (locale === "es") return es_toasts_resume_selfissuefailed2(inputs)
	if (locale === "fr") return fr_toasts_resume_selfissuefailed2(inputs)
	return ar_toasts_resume_selfissuefailed2(inputs)
});
export { toasts_resume_selfissuefailed2 as "toasts.resume.selfIssueFailed" }