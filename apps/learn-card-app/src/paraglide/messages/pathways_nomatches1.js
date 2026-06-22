/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Nomatches1Inputs */

const en_pathways_nomatches1 = /** @type {(inputs: Pathways_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No matches`)
};

const es_pathways_nomatches1 = /** @type {(inputs: Pathways_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin coincidencias`)
};

const fr_pathways_nomatches1 = /** @type {(inputs: Pathways_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune correspondance`)
};

const ar_pathways_nomatches1 = /** @type {(inputs: Pathways_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تطابق`)
};

/**
* | output |
* | --- |
* | "No matches" |
*
* @param {Pathways_Nomatches1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_nomatches1 = /** @type {((inputs?: Pathways_Nomatches1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Nomatches1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_nomatches1(inputs)
	if (locale === "es") return es_pathways_nomatches1(inputs)
	if (locale === "fr") return fr_pathways_nomatches1(inputs)
	return ar_pathways_nomatches1(inputs)
});
export { pathways_nomatches1 as "pathways.noMatches" }