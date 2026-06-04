/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_GreatInputs */

const en_pathways_great = /** @type {(inputs: Pathways_GreatInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Great`)
};

const es_pathways_great = /** @type {(inputs: Pathways_GreatInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Genial`)
};

const de_pathways_great = /** @type {(inputs: Pathways_GreatInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sehr gut`)
};

const ar_pathways_great = /** @type {(inputs: Pathways_GreatInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رائع`)
};

const fr_pathways_great = /** @type {(inputs: Pathways_GreatInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Très bien`)
};

const ko_pathways_great = /** @type {(inputs: Pathways_GreatInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`매우 좋음`)
};

/**
* | output |
* | --- |
* | "Great" |
*
* @param {Pathways_GreatInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_great = /** @type {((inputs?: Pathways_GreatInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_GreatInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_great(inputs)
	if (locale === "es") return es_pathways_great(inputs)
	if (locale === "de") return de_pathways_great(inputs)
	if (locale === "ar") return ar_pathways_great(inputs)
	if (locale === "fr") return fr_pathways_great(inputs)
	return ko_pathways_great(inputs)
});
export { pathways_great as "pathways.great" }