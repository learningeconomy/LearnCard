/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Noexperiencerequired2Inputs */

const en_pathways_noexperiencerequired2 = /** @type {(inputs: Pathways_Noexperiencerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No prior experience required`)
};

const es_pathways_noexperiencerequired2 = /** @type {(inputs: Pathways_Noexperiencerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No requiere experiencia previa`)
};

const fr_pathways_noexperiencerequired2 = /** @type {(inputs: Pathways_Noexperiencerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune expérience préalable requise`)
};

const ar_pathways_noexperiencerequired2 = /** @type {(inputs: Pathways_Noexperiencerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تلزم خبرة سابقة`)
};

/**
* | output |
* | --- |
* | "No prior experience required" |
*
* @param {Pathways_Noexperiencerequired2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_noexperiencerequired2 = /** @type {((inputs?: Pathways_Noexperiencerequired2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Noexperiencerequired2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_noexperiencerequired2(inputs)
	if (locale === "es") return es_pathways_noexperiencerequired2(inputs)
	if (locale === "fr") return fr_pathways_noexperiencerequired2(inputs)
	return ar_pathways_noexperiencerequired2(inputs)
});
export { pathways_noexperiencerequired2 as "pathways.noExperienceRequired" }