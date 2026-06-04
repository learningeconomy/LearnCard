/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Frameworkimported1Inputs */

const en_toasts_skills_frameworkimported1 = /** @type {(inputs: Toasts_Skills_Frameworkimported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OpenSALT framework imported and synced.`)
};

const es_toasts_skills_frameworkimported1 = /** @type {(inputs: Toasts_Skills_Frameworkimported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco OpenSALT importado y sincronizado.`)
};

const de_toasts_skills_frameworkimported1 = /** @type {(inputs: Toasts_Skills_Frameworkimported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OpenSALT-Rahmen importiert und synchronisiert.`)
};

const ar_toasts_skills_frameworkimported1 = /** @type {(inputs: Toasts_Skills_Frameworkimported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم استيراد ومزامنة إطار OpenSALT.`)
};

const fr_toasts_skills_frameworkimported1 = /** @type {(inputs: Toasts_Skills_Frameworkimported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre OpenSALT importé et synchronisé.`)
};

const ko_toasts_skills_frameworkimported1 = /** @type {(inputs: Toasts_Skills_Frameworkimported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OpenSALT 프레임워크가 가져오기 및 동기화되었습니다.`)
};

/**
* | output |
* | --- |
* | "OpenSALT framework imported and synced." |
*
* @param {Toasts_Skills_Frameworkimported1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_frameworkimported1 = /** @type {((inputs?: Toasts_Skills_Frameworkimported1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Frameworkimported1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_frameworkimported1(inputs)
	if (locale === "es") return es_toasts_skills_frameworkimported1(inputs)
	if (locale === "de") return de_toasts_skills_frameworkimported1(inputs)
	if (locale === "ar") return ar_toasts_skills_frameworkimported1(inputs)
	if (locale === "fr") return fr_toasts_skills_frameworkimported1(inputs)
	return ko_toasts_skills_frameworkimported1(inputs)
});
export { toasts_skills_frameworkimported1 as "toasts.skills.frameworkImported" }