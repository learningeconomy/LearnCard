/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Frameworkimportfailed2Inputs */

const en_toasts_skills_frameworkimportfailed2 = /** @type {(inputs: Toasts_Skills_Frameworkimportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to import framework.`)
};

const es_toasts_skills_frameworkimportfailed2 = /** @type {(inputs: Toasts_Skills_Frameworkimportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo importar el marco.`)
};

const de_toasts_skills_frameworkimportfailed2 = /** @type {(inputs: Toasts_Skills_Frameworkimportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rahmen konnte nicht importiert werden.`)
};

const ar_toasts_skills_frameworkimportfailed2 = /** @type {(inputs: Toasts_Skills_Frameworkimportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر استيراد الإطار.`)
};

const fr_toasts_skills_frameworkimportfailed2 = /** @type {(inputs: Toasts_Skills_Frameworkimportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'importer le cadre.`)
};

const ko_toasts_skills_frameworkimportfailed2 = /** @type {(inputs: Toasts_Skills_Frameworkimportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프레임워크를 가져올 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "Unable to import framework." |
*
* @param {Toasts_Skills_Frameworkimportfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_frameworkimportfailed2 = /** @type {((inputs?: Toasts_Skills_Frameworkimportfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Frameworkimportfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_frameworkimportfailed2(inputs)
	if (locale === "es") return es_toasts_skills_frameworkimportfailed2(inputs)
	if (locale === "de") return de_toasts_skills_frameworkimportfailed2(inputs)
	if (locale === "ar") return ar_toasts_skills_frameworkimportfailed2(inputs)
	if (locale === "fr") return fr_toasts_skills_frameworkimportfailed2(inputs)
	return ko_toasts_skills_frameworkimportfailed2(inputs)
});
export { toasts_skills_frameworkimportfailed2 as "toasts.skills.frameworkImportFailed" }