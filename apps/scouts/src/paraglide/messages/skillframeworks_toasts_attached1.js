/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Toasts_Attached1Inputs */

const en_skillframeworks_toasts_attached1 = /** @type {(inputs: Skillframeworks_Toasts_Attached1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework attached to network!`)
};

const es_skillframeworks_toasts_attached1 = /** @type {(inputs: Skillframeworks_Toasts_Attached1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Marco adjuntado a la red!`)
};

const fr_skillframeworks_toasts_attached1 = /** @type {(inputs: Skillframeworks_Toasts_Attached1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre attaché au réseau !`)
};

const ar_skillframeworks_toasts_attached1 = /** @type {(inputs: Skillframeworks_Toasts_Attached1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرفاق الإطار بالشبكة!`)
};

/**
* | output |
* | --- |
* | "Framework attached to network!" |
*
* @param {Skillframeworks_Toasts_Attached1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_toasts_attached1 = /** @type {((inputs?: Skillframeworks_Toasts_Attached1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Toasts_Attached1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_toasts_attached1(inputs)
	if (locale === "es") return es_skillframeworks_toasts_attached1(inputs)
	if (locale === "fr") return fr_skillframeworks_toasts_attached1(inputs)
	return ar_skillframeworks_toasts_attached1(inputs)
});
export { skillframeworks_toasts_attached1 as "skillFrameworks.toasts.attached" }