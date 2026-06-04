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

const de_toasts_resume_linkcopyfailed2 = /** @type {(inputs: Toasts_Resume_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lebenslauf-Link konnte nicht kopiert werden`)
};

const ar_toasts_resume_linkcopyfailed2 = /** @type {(inputs: Toasts_Resume_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط السيرة الذاتية`)
};

const fr_toasts_resume_linkcopyfailed2 = /** @type {(inputs: Toasts_Resume_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien du CV`)
};

const ko_toasts_resume_linkcopyfailed2 = /** @type {(inputs: Toasts_Resume_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이력서 링크를 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy resume link to clipboard" |
*
* @param {Toasts_Resume_Linkcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_linkcopyfailed2 = /** @type {((inputs?: Toasts_Resume_Linkcopyfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Linkcopyfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_linkcopyfailed2(inputs)
	if (locale === "es") return es_toasts_resume_linkcopyfailed2(inputs)
	if (locale === "de") return de_toasts_resume_linkcopyfailed2(inputs)
	if (locale === "ar") return ar_toasts_resume_linkcopyfailed2(inputs)
	if (locale === "fr") return fr_toasts_resume_linkcopyfailed2(inputs)
	return ko_toasts_resume_linkcopyfailed2(inputs)
});
export { toasts_resume_linkcopyfailed2 as "toasts.resume.linkCopyFailed" }