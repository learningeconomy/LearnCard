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

const fr_pathways_great = /** @type {(inputs: Pathways_GreatInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Très bien`)
};

const ar_pathways_great = /** @type {(inputs: Pathways_GreatInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رائع`)
};

/**
* | output |
* | --- |
* | "Great" |
*
* @param {Pathways_GreatInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_great = /** @type {((inputs?: Pathways_GreatInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_GreatInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_great(inputs)
	if (locale === "es") return es_pathways_great(inputs)
	if (locale === "fr") return fr_pathways_great(inputs)
	return ar_pathways_great(inputs)
});
export { pathways_great as "pathways.great" }