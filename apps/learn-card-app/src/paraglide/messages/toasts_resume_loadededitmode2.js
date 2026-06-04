/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Loadededitmode2Inputs */

const en_toasts_resume_loadededitmode2 = /** @type {(inputs: Toasts_Resume_Loadededitmode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loaded resume into edit mode.`)
};

const es_toasts_resume_loadededitmode2 = /** @type {(inputs: Toasts_Resume_Loadededitmode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Currículum cargado en modo de edición.`)
};

const de_toasts_resume_loadededitmode2 = /** @type {(inputs: Toasts_Resume_Loadededitmode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lebenslauf in den Bearbeitungsmodus geladen.`)
};

const ar_toasts_resume_loadededitmode2 = /** @type {(inputs: Toasts_Resume_Loadededitmode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحميل السيرة الذاتية في وضع التعديل.`)
};

const fr_toasts_resume_loadededitmode2 = /** @type {(inputs: Toasts_Resume_Loadededitmode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CV chargé en mode édition.`)
};

const ko_toasts_resume_loadededitmode2 = /** @type {(inputs: Toasts_Resume_Loadededitmode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`편집 모드로 이력서가 로드되었습니다.`)
};

/**
* | output |
* | --- |
* | "Loaded resume into edit mode." |
*
* @param {Toasts_Resume_Loadededitmode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_loadededitmode2 = /** @type {((inputs?: Toasts_Resume_Loadededitmode2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Loadededitmode2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_loadededitmode2(inputs)
	if (locale === "es") return es_toasts_resume_loadededitmode2(inputs)
	if (locale === "de") return de_toasts_resume_loadededitmode2(inputs)
	if (locale === "ar") return ar_toasts_resume_loadededitmode2(inputs)
	if (locale === "fr") return fr_toasts_resume_loadededitmode2(inputs)
	return ko_toasts_resume_loadededitmode2(inputs)
});
export { toasts_resume_loadededitmode2 as "toasts.resume.loadedEditMode" }