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

const de_pathways_noexperiencerequired2 = /** @type {(inputs: Pathways_Noexperiencerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine Vorerfahrung erforderlich`)
};

const ar_pathways_noexperiencerequired2 = /** @type {(inputs: Pathways_Noexperiencerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تلزم خبرة سابقة`)
};

const fr_pathways_noexperiencerequired2 = /** @type {(inputs: Pathways_Noexperiencerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune expérience préalable requise`)
};

const ko_pathways_noexperiencerequired2 = /** @type {(inputs: Pathways_Noexperiencerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이전 경험 불필요`)
};

/**
* | output |
* | --- |
* | "No prior experience required" |
*
* @param {Pathways_Noexperiencerequired2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_noexperiencerequired2 = /** @type {((inputs?: Pathways_Noexperiencerequired2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Noexperiencerequired2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_noexperiencerequired2(inputs)
	if (locale === "es") return es_pathways_noexperiencerequired2(inputs)
	if (locale === "de") return de_pathways_noexperiencerequired2(inputs)
	if (locale === "ar") return ar_pathways_noexperiencerequired2(inputs)
	if (locale === "fr") return fr_pathways_noexperiencerequired2(inputs)
	return ko_pathways_noexperiencerequired2(inputs)
});
export { pathways_noexperiencerequired2 as "pathways.noExperienceRequired" }