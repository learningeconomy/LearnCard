/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Downloadfailed1Inputs */

const en_toasts_resume_downloadfailed1 = /** @type {(inputs: Toasts_Resume_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to save and download resume.`)
};

const es_toasts_resume_downloadfailed1 = /** @type {(inputs: Toasts_Resume_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al guardar y descargar el currículum.`)
};

const de_toasts_resume_downloadfailed1 = /** @type {(inputs: Toasts_Resume_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichern und Herunterladen des Lebenslaufs fehlgeschlagen.`)
};

const ar_toasts_resume_downloadfailed1 = /** @type {(inputs: Toasts_Resume_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حفظ وتنزيل السيرة الذاتية.`)
};

const fr_toasts_resume_downloadfailed1 = /** @type {(inputs: Toasts_Resume_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'enregistrement et du téléchargement du CV.`)
};

const ko_toasts_resume_downloadfailed1 = /** @type {(inputs: Toasts_Resume_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이력서를 저장하고 다운로드하지 못했습니다.`)
};

/**
* | output |
* | --- |
* | "Failed to save and download resume." |
*
* @param {Toasts_Resume_Downloadfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_downloadfailed1 = /** @type {((inputs?: Toasts_Resume_Downloadfailed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Downloadfailed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_downloadfailed1(inputs)
	if (locale === "es") return es_toasts_resume_downloadfailed1(inputs)
	if (locale === "de") return de_toasts_resume_downloadfailed1(inputs)
	if (locale === "ar") return ar_toasts_resume_downloadfailed1(inputs)
	if (locale === "fr") return fr_toasts_resume_downloadfailed1(inputs)
	return ko_toasts_resume_downloadfailed1(inputs)
});
export { toasts_resume_downloadfailed1 as "toasts.resume.downloadFailed" }