/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Linkcopied1Inputs */

const en_toasts_resume_linkcopied1 = /** @type {(inputs: Toasts_Resume_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resume link copied to clipboard`)
};

const es_toasts_resume_linkcopied1 = /** @type {(inputs: Toasts_Resume_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace del currículum copiado al portapapeles`)
};

const fr_toasts_resume_linkcopied1 = /** @type {(inputs: Toasts_Resume_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien du CV copié dans le presse-papiers`)
};

const ar_toasts_resume_linkcopied1 = /** @type {(inputs: Toasts_Resume_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط السيرة الذاتية إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Resume link copied to clipboard" |
*
* @param {Toasts_Resume_Linkcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_linkcopied1 = /** @type {((inputs?: Toasts_Resume_Linkcopied1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Linkcopied1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_linkcopied1(inputs)
	if (locale === "es") return es_toasts_resume_linkcopied1(inputs)
	if (locale === "fr") return fr_toasts_resume_linkcopied1(inputs)
	return ar_toasts_resume_linkcopied1(inputs)
});
export { toasts_resume_linkcopied1 as "toasts.resume.linkCopied" }