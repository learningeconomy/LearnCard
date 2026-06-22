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

const fr_toasts_resume_newdraft1 = /** @type {(inputs: Toasts_Resume_Newdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau brouillon de CV commencé.`)
};

const ar_toasts_resume_newdraft1 = /** @type {(inputs: Toasts_Resume_Newdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم بدء مسودة سيرة ذاتية جديدة.`)
};

/**
* | output |
* | --- |
* | "Started a new resume draft." |
*
* @param {Toasts_Resume_Newdraft1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_newdraft1 = /** @type {((inputs?: Toasts_Resume_Newdraft1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Newdraft1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_newdraft1(inputs)
	if (locale === "es") return es_toasts_resume_newdraft1(inputs)
	if (locale === "fr") return fr_toasts_resume_newdraft1(inputs)
	return ar_toasts_resume_newdraft1(inputs)
});
export { toasts_resume_newdraft1 as "toasts.resume.newDraft" }