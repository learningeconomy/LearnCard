/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Linkcopyfailed2Inputs */

const en_toasts_resume_linkcopyfailed2 = /** @type {(inputs: Toasts_Resume_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy resume link to clipboard`)
};

const es_toasts_resume_linkcopyfailed2 = /** @type {(inputs: Toasts_Resume_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace del currículum`)
};

const fr_toasts_resume_linkcopyfailed2 = /** @type {(inputs: Toasts_Resume_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien du CV`)
};

const ar_toasts_resume_linkcopyfailed2 = /** @type {(inputs: Toasts_Resume_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط السيرة الذاتية`)
};

/**
* | output |
* | --- |
* | "Unable to copy resume link to clipboard" |
*
* @param {Toasts_Resume_Linkcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_linkcopyfailed2 = /** @type {((inputs?: Toasts_Resume_Linkcopyfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Linkcopyfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_linkcopyfailed2(inputs)
	if (locale === "es") return es_toasts_resume_linkcopyfailed2(inputs)
	if (locale === "fr") return fr_toasts_resume_linkcopyfailed2(inputs)
	return ar_toasts_resume_linkcopyfailed2(inputs)
});
export { toasts_resume_linkcopyfailed2 as "toasts.resume.linkCopyFailed" }