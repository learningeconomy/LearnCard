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

const fr_toasts_skills_frameworksynced1 = /** @type {(inputs: Toasts_Skills_Frameworksynced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre synchronisé avec succès.`)
};

const ar_toasts_skills_frameworksynced1 = /** @type {(inputs: Toasts_Skills_Frameworksynced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم مزامنة الإطار بنجاح.`)
};

/**
* | output |
* | --- |
* | "Framework synced successfully." |
*
* @param {Toasts_Skills_Frameworksynced1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_skills_frameworksynced1 = /** @type {((inputs?: Toasts_Skills_Frameworksynced1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Frameworksynced1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_frameworksynced1(inputs)
	if (locale === "es") return es_toasts_skills_frameworksynced1(inputs)
	if (locale === "fr") return fr_toasts_skills_frameworksynced1(inputs)
	return ar_toasts_skills_frameworksynced1(inputs)
});
export { toasts_skills_frameworksynced1 as "toasts.skills.frameworkSynced" }