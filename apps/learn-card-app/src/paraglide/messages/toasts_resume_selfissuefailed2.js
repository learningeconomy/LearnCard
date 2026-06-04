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

const de_toasts_resume_selfissuefailed2 = /** @type {(inputs: Toasts_Resume_Selfissuefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selbstausstellung der Berechtigung fehlgeschlagen`)
};

const ar_toasts_resume_selfissuefailed2 = /** @type {(inputs: Toasts_Resume_Selfissuefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر الإصدار الذاتي لبيانات الاعتماد`)
};

const fr_toasts_resume_selfissuefailed2 = /** @type {(inputs: Toasts_Resume_Selfissuefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'auto-émettre l'accréditation`)
};

const ko_toasts_resume_selfissuefailed2 = /** @type {(inputs: Toasts_Resume_Selfissuefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명 자체 발행 실패`)
};

/**
* | output |
* | --- |
* | "Unable to self issue credential" |
*
* @param {Toasts_Resume_Selfissuefailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_selfissuefailed2 = /** @type {((inputs?: Toasts_Resume_Selfissuefailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Selfissuefailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_selfissuefailed2(inputs)
	if (locale === "es") return es_toasts_resume_selfissuefailed2(inputs)
	if (locale === "de") return de_toasts_resume_selfissuefailed2(inputs)
	if (locale === "ar") return ar_toasts_resume_selfissuefailed2(inputs)
	if (locale === "fr") return fr_toasts_resume_selfissuefailed2(inputs)
	return ko_toasts_resume_selfissuefailed2(inputs)
});
export { toasts_resume_selfissuefailed2 as "toasts.resume.selfIssueFailed" }