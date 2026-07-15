/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Toasts_Createfail2Inputs */

const en_skillframeworks_toasts_createfail2 = /** @type {(inputs: Skillframeworks_Toasts_Createfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to create framework. Please try again.`)
};

const es_skillframeworks_toasts_createfail2 = /** @type {(inputs: Skillframeworks_Toasts_Createfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al crear marco. Por favor inténtalo de nuevo.`)
};

const fr_skillframeworks_toasts_createfail2 = /** @type {(inputs: Skillframeworks_Toasts_Createfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la création du cadre. Veuillez réessayer.`)
};

const ar_skillframeworks_toasts_createfail2 = /** @type {(inputs: Skillframeworks_Toasts_Createfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء الإطار. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to create framework. Please try again." |
*
* @param {Skillframeworks_Toasts_Createfail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_toasts_createfail2 = /** @type {((inputs?: Skillframeworks_Toasts_Createfail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Toasts_Createfail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_toasts_createfail2(inputs)
	if (locale === "es") return es_skillframeworks_toasts_createfail2(inputs)
	if (locale === "fr") return fr_skillframeworks_toasts_createfail2(inputs)
	return ar_skillframeworks_toasts_createfail2(inputs)
});
export { skillframeworks_toasts_createfail2 as "skillFrameworks.toasts.createFail" }