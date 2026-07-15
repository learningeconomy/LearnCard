/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Adding1Inputs */

const en_skillframeworks_adding1 = /** @type {(inputs: Skillframeworks_Adding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adding...`)
};

const es_skillframeworks_adding1 = /** @type {(inputs: Skillframeworks_Adding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadiendo...`)
};

const fr_skillframeworks_adding1 = /** @type {(inputs: Skillframeworks_Adding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajout en cours...`)
};

const ar_skillframeworks_adding1 = /** @type {(inputs: Skillframeworks_Adding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإضافة...`)
};

/**
* | output |
* | --- |
* | "Adding..." |
*
* @param {Skillframeworks_Adding1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_adding1 = /** @type {((inputs?: Skillframeworks_Adding1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Adding1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_adding1(inputs)
	if (locale === "es") return es_skillframeworks_adding1(inputs)
	if (locale === "fr") return fr_skillframeworks_adding1(inputs)
	return ar_skillframeworks_adding1(inputs)
});
export { skillframeworks_adding1 as "skillFrameworks.adding" }