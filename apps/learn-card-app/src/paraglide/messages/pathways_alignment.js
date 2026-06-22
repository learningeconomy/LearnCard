/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_AlignmentInputs */

const en_pathways_alignment = /** @type {(inputs: Pathways_AlignmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alignment`)
};

const es_pathways_alignment = /** @type {(inputs: Pathways_AlignmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alineación`)
};

const fr_pathways_alignment = /** @type {(inputs: Pathways_AlignmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alignement`)
};

const ar_pathways_alignment = /** @type {(inputs: Pathways_AlignmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحاذاة`)
};

/**
* | output |
* | --- |
* | "Alignment" |
*
* @param {Pathways_AlignmentInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_alignment = /** @type {((inputs?: Pathways_AlignmentInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_AlignmentInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_alignment(inputs)
	if (locale === "es") return es_pathways_alignment(inputs)
	if (locale === "fr") return fr_pathways_alignment(inputs)
	return ar_pathways_alignment(inputs)
});
export { pathways_alignment as "pathways.alignment" }