/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Downloadsuccess1Inputs */

const en_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resume downloaded successfully.`)
};

const es_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Currículum descargado exitosamente.`)
};

const de_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lebenslauf erfolgreich heruntergeladen.`)
};

const ar_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تنزيل السيرة الذاتية بنجاح.`)
};

const fr_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CV téléchargé avec succès.`)
};

const ko_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이력서가 성공적으로 다운로드되었습니다.`)
};

/**
* | output |
* | --- |
* | "Resume downloaded successfully." |
*
* @param {Toasts_Resume_Downloadsuccess1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_downloadsuccess1 = /** @type {((inputs?: Toasts_Resume_Downloadsuccess1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Downloadsuccess1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_downloadsuccess1(inputs)
	if (locale === "es") return es_toasts_resume_downloadsuccess1(inputs)
	if (locale === "de") return de_toasts_resume_downloadsuccess1(inputs)
	if (locale === "ar") return ar_toasts_resume_downloadsuccess1(inputs)
	if (locale === "fr") return fr_toasts_resume_downloadsuccess1(inputs)
	return ko_toasts_resume_downloadsuccess1(inputs)
});
export { toasts_resume_downloadsuccess1 as "toasts.resume.downloadSuccess" }