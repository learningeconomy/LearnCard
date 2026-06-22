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

const fr_pathways_explorecourses1 = /** @type {(inputs: Pathways_Explorecourses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer les programmes`)
};

const ar_pathways_explorecourses1 = /** @type {(inputs: Pathways_Explorecourses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف البرامج`)
};

/**
* | output |
* | --- |
* | "Explore Programs" |
*
* @param {Pathways_Explorecourses1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_explorecourses1 = /** @type {((inputs?: Pathways_Explorecourses1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Explorecourses1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_explorecourses1(inputs)
	if (locale === "es") return es_pathways_explorecourses1(inputs)
	if (locale === "fr") return fr_pathways_explorecourses1(inputs)
	return ar_pathways_explorecourses1(inputs)
});
export { pathways_explorecourses1 as "pathways.exploreCourses" }