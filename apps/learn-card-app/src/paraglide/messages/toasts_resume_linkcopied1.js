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

const de_toasts_resume_linkcopied1 = /** @type {(inputs: Toasts_Resume_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lebenslauf-Link in die Zwischenablage kopiert`)
};

const ar_toasts_resume_linkcopied1 = /** @type {(inputs: Toasts_Resume_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط السيرة الذاتية إلى الحافظة`)
};

const fr_toasts_resume_linkcopied1 = /** @type {(inputs: Toasts_Resume_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien du CV copié dans le presse-papiers`)
};

const ko_toasts_resume_linkcopied1 = /** @type {(inputs: Toasts_Resume_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이력서 링크가 클립보드에 복사됨`)
};

/**
* | output |
* | --- |
* | "Resume link copied to clipboard" |
*
* @param {Toasts_Resume_Linkcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_linkcopied1 = /** @type {((inputs?: Toasts_Resume_Linkcopied1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Linkcopied1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_linkcopied1(inputs)
	if (locale === "es") return es_toasts_resume_linkcopied1(inputs)
	if (locale === "de") return de_toasts_resume_linkcopied1(inputs)
	if (locale === "ar") return ar_toasts_resume_linkcopied1(inputs)
	if (locale === "fr") return fr_toasts_resume_linkcopied1(inputs)
	return ko_toasts_resume_linkcopied1(inputs)
});
export { toasts_resume_linkcopied1 as "toasts.resume.linkCopied" }