/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Exporting1Inputs */

const en_skillframeworks_exporting1 = /** @type {(inputs: Skillframeworks_Exporting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exporting...`)
};

const es_skillframeworks_exporting1 = /** @type {(inputs: Skillframeworks_Exporting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportando...`)
};

const fr_skillframeworks_exporting1 = /** @type {(inputs: Skillframeworks_Exporting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportation en cours...`)
};

const ar_skillframeworks_exporting1 = /** @type {(inputs: Skillframeworks_Exporting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exporting...`)
};

/**
* | output |
* | --- |
* | "Exporting..." |
*
* @param {Skillframeworks_Exporting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_exporting1 = /** @type {((inputs?: Skillframeworks_Exporting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Exporting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_exporting1(inputs)
	if (locale === "es") return es_skillframeworks_exporting1(inputs)
	if (locale === "fr") return fr_skillframeworks_exporting1(inputs)
	return ar_skillframeworks_exporting1(inputs)
});
export { skillframeworks_exporting1 as "skillFrameworks.exporting" }