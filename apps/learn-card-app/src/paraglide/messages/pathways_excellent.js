/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_ExcellentInputs */

const en_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excellent`)
};

const es_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excelente`)
};

const de_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausgezeichnet`)
};

const ar_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ممتاز`)
};

const fr_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excellent`)
};

const ko_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`우수`)
};

/**
* | output |
* | --- |
* | "Excellent" |
*
* @param {Pathways_ExcellentInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_excellent = /** @type {((inputs?: Pathways_ExcellentInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_ExcellentInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_excellent(inputs)
	if (locale === "es") return es_pathways_excellent(inputs)
	if (locale === "de") return de_pathways_excellent(inputs)
	if (locale === "ar") return ar_pathways_excellent(inputs)
	if (locale === "fr") return fr_pathways_excellent(inputs)
	return ko_pathways_excellent(inputs)
});
export { pathways_excellent as "pathways.excellent" }