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

const fr_toasts_resume_loadededitmode2 = /** @type {(inputs: Toasts_Resume_Loadededitmode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CV chargé en mode édition.`)
};

const ar_toasts_resume_loadededitmode2 = /** @type {(inputs: Toasts_Resume_Loadededitmode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحميل السيرة الذاتية في وضع التعديل.`)
};

/**
* | output |
* | --- |
* | "Loaded resume into edit mode." |
*
* @param {Toasts_Resume_Loadededitmode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_loadededitmode2 = /** @type {((inputs?: Toasts_Resume_Loadededitmode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Loadededitmode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_loadededitmode2(inputs)
	if (locale === "es") return es_toasts_resume_loadededitmode2(inputs)
	if (locale === "fr") return fr_toasts_resume_loadededitmode2(inputs)
	return ar_toasts_resume_loadededitmode2(inputs)
});
export { toasts_resume_loadededitmode2 as "toasts.resume.loadedEditMode" }