/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Explorecourses1Inputs */

const en_pathways_explorecourses1 = /** @type {(inputs: Pathways_Explorecourses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore Programs`)
};

const es_pathways_explorecourses1 = /** @type {(inputs: Pathways_Explorecourses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar programas`)
};

const de_pathways_explorecourses1 = /** @type {(inputs: Pathways_Explorecourses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Programme entdecken`)
};

const ar_pathways_explorecourses1 = /** @type {(inputs: Pathways_Explorecourses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف البرامج`)
};

const fr_pathways_explorecourses1 = /** @type {(inputs: Pathways_Explorecourses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer les programmes`)
};

const ko_pathways_explorecourses1 = /** @type {(inputs: Pathways_Explorecourses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로그램 탐색`)
};

/**
* | output |
* | --- |
* | "Explore Programs" |
*
* @param {Pathways_Explorecourses1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_explorecourses1 = /** @type {((inputs?: Pathways_Explorecourses1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Explorecourses1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_explorecourses1(inputs)
	if (locale === "es") return es_pathways_explorecourses1(inputs)
	if (locale === "de") return de_pathways_explorecourses1(inputs)
	if (locale === "ar") return ar_pathways_explorecourses1(inputs)
	if (locale === "fr") return fr_pathways_explorecourses1(inputs)
	return ko_pathways_explorecourses1(inputs)
});
export { pathways_explorecourses1 as "pathways.exploreCourses" }