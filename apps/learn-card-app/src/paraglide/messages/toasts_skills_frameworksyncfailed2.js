/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Frameworksyncfailed2Inputs */

const en_toasts_skills_frameworksyncfailed2 = /** @type {(inputs: Toasts_Skills_Frameworksyncfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to sync framework.`)
};

const es_toasts_skills_frameworksyncfailed2 = /** @type {(inputs: Toasts_Skills_Frameworksyncfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo sincronizar el marco.`)
};

const fr_toasts_skills_frameworksyncfailed2 = /** @type {(inputs: Toasts_Skills_Frameworksyncfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de synchroniser le cadre.`)
};

const ar_toasts_skills_frameworksyncfailed2 = /** @type {(inputs: Toasts_Skills_Frameworksyncfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر مزامنة الإطار.`)
};

/**
* | output |
* | --- |
* | "Unable to sync framework." |
*
* @param {Toasts_Skills_Frameworksyncfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_skills_frameworksyncfailed2 = /** @type {((inputs?: Toasts_Skills_Frameworksyncfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Frameworksyncfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_frameworksyncfailed2(inputs)
	if (locale === "es") return es_toasts_skills_frameworksyncfailed2(inputs)
	if (locale === "fr") return fr_toasts_skills_frameworksyncfailed2(inputs)
	return ar_toasts_skills_frameworksyncfailed2(inputs)
});
export { toasts_skills_frameworksyncfailed2 as "toasts.skills.frameworkSyncFailed" }