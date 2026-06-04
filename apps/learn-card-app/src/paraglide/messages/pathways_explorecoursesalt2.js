/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Explorecoursesalt2Inputs */

const en_pathways_explorecoursesalt2 = /** @type {(inputs: Pathways_Explorecoursesalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore Courses`)
};

const es_pathways_explorecoursesalt2 = /** @type {(inputs: Pathways_Explorecoursesalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar cursos`)
};

const de_pathways_explorecoursesalt2 = /** @type {(inputs: Pathways_Explorecoursesalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kurse entdecken`)
};

const ar_pathways_explorecoursesalt2 = /** @type {(inputs: Pathways_Explorecoursesalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف الدورات`)
};

const fr_pathways_explorecoursesalt2 = /** @type {(inputs: Pathways_Explorecoursesalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer les cours`)
};

const ko_pathways_explorecoursesalt2 = /** @type {(inputs: Pathways_Explorecoursesalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`과정 탐색`)
};

/**
* | output |
* | --- |
* | "Explore Courses" |
*
* @param {Pathways_Explorecoursesalt2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_explorecoursesalt2 = /** @type {((inputs?: Pathways_Explorecoursesalt2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Explorecoursesalt2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_explorecoursesalt2(inputs)
	if (locale === "es") return es_pathways_explorecoursesalt2(inputs)
	if (locale === "de") return de_pathways_explorecoursesalt2(inputs)
	if (locale === "ar") return ar_pathways_explorecoursesalt2(inputs)
	if (locale === "fr") return fr_pathways_explorecoursesalt2(inputs)
	return ko_pathways_explorecoursesalt2(inputs)
});
export { pathways_explorecoursesalt2 as "pathways.exploreCoursesAlt" }