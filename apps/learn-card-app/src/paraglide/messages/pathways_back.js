/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_BackInputs */

const en_pathways_back = /** @type {(inputs: Pathways_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_pathways_back = /** @type {(inputs: Pathways_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const de_pathways_back = /** @type {(inputs: Pathways_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zurück`)
};

const ar_pathways_back = /** @type {(inputs: Pathways_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

const fr_pathways_back = /** @type {(inputs: Pathways_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ko_pathways_back = /** @type {(inputs: Pathways_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이전`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Pathways_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_back = /** @type {((inputs?: Pathways_BackInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_BackInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_back(inputs)
	if (locale === "es") return es_pathways_back(inputs)
	if (locale === "de") return de_pathways_back(inputs)
	if (locale === "ar") return ar_pathways_back(inputs)
	if (locale === "fr") return fr_pathways_back(inputs)
	return ko_pathways_back(inputs)
});
export { pathways_back as "pathways.back" }