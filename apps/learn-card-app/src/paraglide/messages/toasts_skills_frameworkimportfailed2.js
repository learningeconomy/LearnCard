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

const fr_toasts_skills_frameworkimportfailed2 = /** @type {(inputs: Toasts_Skills_Frameworkimportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'importer le cadre.`)
};

const ar_toasts_skills_frameworkimportfailed2 = /** @type {(inputs: Toasts_Skills_Frameworkimportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر استيراد الإطار.`)
};

/**
* | output |
* | --- |
* | "Unable to import framework." |
*
* @param {Toasts_Skills_Frameworkimportfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_skills_frameworkimportfailed2 = /** @type {((inputs?: Toasts_Skills_Frameworkimportfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Frameworkimportfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_frameworkimportfailed2(inputs)
	if (locale === "es") return es_toasts_skills_frameworkimportfailed2(inputs)
	if (locale === "fr") return fr_toasts_skills_frameworkimportfailed2(inputs)
	return ar_toasts_skills_frameworkimportfailed2(inputs)
});
export { toasts_skills_frameworkimportfailed2 as "toasts.skills.frameworkImportFailed" }