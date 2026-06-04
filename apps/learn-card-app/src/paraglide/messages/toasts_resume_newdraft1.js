/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Newdraft1Inputs */

const en_toasts_resume_newdraft1 = /** @type {(inputs: Toasts_Resume_Newdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Started a new resume draft.`)
};

const es_toasts_resume_newdraft1 = /** @type {(inputs: Toasts_Resume_Newdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se inició un nuevo borrador de currículum.`)
};

const de_toasts_resume_newdraft1 = /** @type {(inputs: Toasts_Resume_Newdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neuer Lebenslauf-Entwurf gestartet.`)
};

const ar_toasts_resume_newdraft1 = /** @type {(inputs: Toasts_Resume_Newdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم بدء مسودة سيرة ذاتية جديدة.`)
};

const fr_toasts_resume_newdraft1 = /** @type {(inputs: Toasts_Resume_Newdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau brouillon de CV commencé.`)
};

const ko_toasts_resume_newdraft1 = /** @type {(inputs: Toasts_Resume_Newdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 이력서 초안이 시작되었습니다.`)
};

/**
* | output |
* | --- |
* | "Started a new resume draft." |
*
* @param {Toasts_Resume_Newdraft1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_newdraft1 = /** @type {((inputs?: Toasts_Resume_Newdraft1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Newdraft1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_newdraft1(inputs)
	if (locale === "es") return es_toasts_resume_newdraft1(inputs)
	if (locale === "de") return de_toasts_resume_newdraft1(inputs)
	if (locale === "ar") return ar_toasts_resume_newdraft1(inputs)
	if (locale === "fr") return fr_toasts_resume_newdraft1(inputs)
	return ko_toasts_resume_newdraft1(inputs)
});
export { toasts_resume_newdraft1 as "toasts.resume.newDraft" }