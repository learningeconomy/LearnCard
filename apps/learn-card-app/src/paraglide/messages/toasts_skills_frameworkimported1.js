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

const fr_toasts_skills_frameworkimported1 = /** @type {(inputs: Toasts_Skills_Frameworkimported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre OpenSALT importé et synchronisé.`)
};

const ar_toasts_skills_frameworkimported1 = /** @type {(inputs: Toasts_Skills_Frameworkimported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم استيراد ومزامنة إطار OpenSALT.`)
};

/**
* | output |
* | --- |
* | "OpenSALT framework imported and synced." |
*
* @param {Toasts_Skills_Frameworkimported1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_skills_frameworkimported1 = /** @type {((inputs?: Toasts_Skills_Frameworkimported1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Frameworkimported1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_frameworkimported1(inputs)
	if (locale === "es") return es_toasts_skills_frameworkimported1(inputs)
	if (locale === "fr") return fr_toasts_skills_frameworkimported1(inputs)
	return ar_toasts_skills_frameworkimported1(inputs)
});
export { toasts_skills_frameworkimported1 as "toasts.skills.frameworkImported" }