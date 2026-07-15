/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Unknown1Inputs */

const en_skillframeworks_unknown1 = /** @type {(inputs: Skillframeworks_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown`)
};

const es_skillframeworks_unknown1 = /** @type {(inputs: Skillframeworks_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconocido`)
};

const fr_skillframeworks_unknown1 = /** @type {(inputs: Skillframeworks_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inconnu`)
};

const ar_skillframeworks_unknown1 = /** @type {(inputs: Skillframeworks_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير معروف`)
};

/**
* | output |
* | --- |
* | "Unknown" |
*
* @param {Skillframeworks_Unknown1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_unknown1 = /** @type {((inputs?: Skillframeworks_Unknown1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Unknown1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_unknown1(inputs)
	if (locale === "es") return es_skillframeworks_unknown1(inputs)
	if (locale === "fr") return fr_skillframeworks_unknown1(inputs)
	return ar_skillframeworks_unknown1(inputs)
});
export { skillframeworks_unknown1 as "skillFrameworks.unknown" }