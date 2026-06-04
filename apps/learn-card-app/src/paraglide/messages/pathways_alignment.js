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

const de_pathways_alignment = /** @type {(inputs: Pathways_AlignmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Übereinstimmung`)
};

const ar_pathways_alignment = /** @type {(inputs: Pathways_AlignmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحاذاة`)
};

const fr_pathways_alignment = /** @type {(inputs: Pathways_AlignmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alignement`)
};

const ko_pathways_alignment = /** @type {(inputs: Pathways_AlignmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`정렬`)
};

/**
* | output |
* | --- |
* | "Alignment" |
*
* @param {Pathways_AlignmentInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_alignment = /** @type {((inputs?: Pathways_AlignmentInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_AlignmentInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_alignment(inputs)
	if (locale === "es") return es_pathways_alignment(inputs)
	if (locale === "de") return de_pathways_alignment(inputs)
	if (locale === "ar") return ar_pathways_alignment(inputs)
	if (locale === "fr") return fr_pathways_alignment(inputs)
	return ko_pathways_alignment(inputs)
});
export { pathways_alignment as "pathways.alignment" }