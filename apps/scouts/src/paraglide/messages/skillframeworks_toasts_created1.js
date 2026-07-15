/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Toasts_Created1Inputs */

const en_skillframeworks_toasts_created1 = /** @type {(inputs: Skillframeworks_Toasts_Created1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework created successfully!`)
};

const es_skillframeworks_toasts_created1 = /** @type {(inputs: Skillframeworks_Toasts_Created1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Marco creado exitosamente!`)
};

const fr_skillframeworks_toasts_created1 = /** @type {(inputs: Skillframeworks_Toasts_Created1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre créé avec succès !`)
};

const ar_skillframeworks_toasts_created1 = /** @type {(inputs: Skillframeworks_Toasts_Created1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework created successfully!`)
};

/**
* | output |
* | --- |
* | "Framework created successfully!" |
*
* @param {Skillframeworks_Toasts_Created1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_toasts_created1 = /** @type {((inputs?: Skillframeworks_Toasts_Created1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Toasts_Created1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_toasts_created1(inputs)
	if (locale === "es") return es_skillframeworks_toasts_created1(inputs)
	if (locale === "fr") return fr_skillframeworks_toasts_created1(inputs)
	return ar_skillframeworks_toasts_created1(inputs)
});
export { skillframeworks_toasts_created1 as "skillFrameworks.toasts.created" }