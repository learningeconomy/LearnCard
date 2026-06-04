/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Frameworksynced1Inputs */

const en_toasts_skills_frameworksynced1 = /** @type {(inputs: Toasts_Skills_Frameworksynced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework synced successfully.`)
};

const es_toasts_skills_frameworksynced1 = /** @type {(inputs: Toasts_Skills_Frameworksynced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco sincronizado exitosamente.`)
};

const de_toasts_skills_frameworksynced1 = /** @type {(inputs: Toasts_Skills_Frameworksynced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rahmen erfolgreich synchronisiert.`)
};

const ar_toasts_skills_frameworksynced1 = /** @type {(inputs: Toasts_Skills_Frameworksynced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم مزامنة الإطار بنجاح.`)
};

const fr_toasts_skills_frameworksynced1 = /** @type {(inputs: Toasts_Skills_Frameworksynced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre synchronisé avec succès.`)
};

const ko_toasts_skills_frameworksynced1 = /** @type {(inputs: Toasts_Skills_Frameworksynced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프레임워크가 동기화되었습니다.`)
};

/**
* | output |
* | --- |
* | "Framework synced successfully." |
*
* @param {Toasts_Skills_Frameworksynced1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_frameworksynced1 = /** @type {((inputs?: Toasts_Skills_Frameworksynced1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Frameworksynced1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_frameworksynced1(inputs)
	if (locale === "es") return es_toasts_skills_frameworksynced1(inputs)
	if (locale === "de") return de_toasts_skills_frameworksynced1(inputs)
	if (locale === "ar") return ar_toasts_skills_frameworksynced1(inputs)
	if (locale === "fr") return fr_toasts_skills_frameworksynced1(inputs)
	return ko_toasts_skills_frameworksynced1(inputs)
});
export { toasts_skills_frameworksynced1 as "toasts.skills.frameworkSynced" }