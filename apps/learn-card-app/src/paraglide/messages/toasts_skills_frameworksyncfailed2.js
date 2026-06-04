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

const de_toasts_skills_frameworksyncfailed2 = /** @type {(inputs: Toasts_Skills_Frameworksyncfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rahmen konnte nicht synchronisiert werden.`)
};

const ar_toasts_skills_frameworksyncfailed2 = /** @type {(inputs: Toasts_Skills_Frameworksyncfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر مزامنة الإطار.`)
};

const fr_toasts_skills_frameworksyncfailed2 = /** @type {(inputs: Toasts_Skills_Frameworksyncfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de synchroniser le cadre.`)
};

const ko_toasts_skills_frameworksyncfailed2 = /** @type {(inputs: Toasts_Skills_Frameworksyncfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프레임워크를 동기화할 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "Unable to sync framework." |
*
* @param {Toasts_Skills_Frameworksyncfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_frameworksyncfailed2 = /** @type {((inputs?: Toasts_Skills_Frameworksyncfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Frameworksyncfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_frameworksyncfailed2(inputs)
	if (locale === "es") return es_toasts_skills_frameworksyncfailed2(inputs)
	if (locale === "de") return de_toasts_skills_frameworksyncfailed2(inputs)
	if (locale === "ar") return ar_toasts_skills_frameworksyncfailed2(inputs)
	if (locale === "fr") return fr_toasts_skills_frameworksyncfailed2(inputs)
	return ko_toasts_skills_frameworksyncfailed2(inputs)
});
export { toasts_skills_frameworksyncfailed2 as "toasts.skills.frameworkSyncFailed" }