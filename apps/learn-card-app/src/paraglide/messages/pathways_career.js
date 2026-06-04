/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_CareerInputs */

const en_pathways_career = /** @type {(inputs: Pathways_CareerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Career`)
};

const es_pathways_career = /** @type {(inputs: Pathways_CareerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carrera`)
};

const de_pathways_career = /** @type {(inputs: Pathways_CareerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Karriere`)
};

const ar_pathways_career = /** @type {(inputs: Pathways_CareerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسيرة المهنية`)
};

const fr_pathways_career = /** @type {(inputs: Pathways_CareerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carrière`)
};

const ko_pathways_career = /** @type {(inputs: Pathways_CareerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경력`)
};

/**
* | output |
* | --- |
* | "Career" |
*
* @param {Pathways_CareerInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_career = /** @type {((inputs?: Pathways_CareerInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_CareerInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_career(inputs)
	if (locale === "es") return es_pathways_career(inputs)
	if (locale === "de") return de_pathways_career(inputs)
	if (locale === "ar") return ar_pathways_career(inputs)
	if (locale === "fr") return fr_pathways_career(inputs)
	return ko_pathways_career(inputs)
});
export { pathways_career as "pathways.career" }