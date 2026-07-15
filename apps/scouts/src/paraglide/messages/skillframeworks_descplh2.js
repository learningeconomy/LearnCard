/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Descplh2Inputs */

const en_skillframeworks_descplh2 = /** @type {(inputs: Skillframeworks_Descplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe this framework...`)
};

const es_skillframeworks_descplh2 = /** @type {(inputs: Skillframeworks_Descplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe este marco...`)
};

const fr_skillframeworks_descplh2 = /** @type {(inputs: Skillframeworks_Descplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décrivez ce cadre...`)
};

const ar_skillframeworks_descplh2 = /** @type {(inputs: Skillframeworks_Descplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe this framework...`)
};

/**
* | output |
* | --- |
* | "Describe this framework..." |
*
* @param {Skillframeworks_Descplh2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_descplh2 = /** @type {((inputs?: Skillframeworks_Descplh2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Descplh2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_descplh2(inputs)
	if (locale === "es") return es_skillframeworks_descplh2(inputs)
	if (locale === "fr") return fr_skillframeworks_descplh2(inputs)
	return ar_skillframeworks_descplh2(inputs)
});
export { skillframeworks_descplh2 as "skillFrameworks.descPlh" }