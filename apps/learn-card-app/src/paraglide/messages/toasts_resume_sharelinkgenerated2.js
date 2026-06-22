/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Sharelinkgenerated2Inputs */

const en_toasts_resume_sharelinkgenerated2 = /** @type {(inputs: Toasts_Resume_Sharelinkgenerated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to generate resume share link.`)
};

const es_toasts_resume_sharelinkgenerated2 = /** @type {(inputs: Toasts_Resume_Sharelinkgenerated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo generar el enlace para compartir el currículum.`)
};

const fr_toasts_resume_sharelinkgenerated2 = /** @type {(inputs: Toasts_Resume_Sharelinkgenerated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de générer le lien de partage du CV.`)
};

const ar_toasts_resume_sharelinkgenerated2 = /** @type {(inputs: Toasts_Resume_Sharelinkgenerated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر إنشاء رابط مشاركة السيرة الذاتية.`)
};

/**
* | output |
* | --- |
* | "Unable to generate resume share link." |
*
* @param {Toasts_Resume_Sharelinkgenerated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_sharelinkgenerated2 = /** @type {((inputs?: Toasts_Resume_Sharelinkgenerated2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Sharelinkgenerated2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_sharelinkgenerated2(inputs)
	if (locale === "es") return es_toasts_resume_sharelinkgenerated2(inputs)
	if (locale === "fr") return fr_toasts_resume_sharelinkgenerated2(inputs)
	return ar_toasts_resume_sharelinkgenerated2(inputs)
});
export { toasts_resume_sharelinkgenerated2 as "toasts.resume.shareLinkGenerated" }