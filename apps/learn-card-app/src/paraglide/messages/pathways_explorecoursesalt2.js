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

const fr_pathways_explorecoursesalt2 = /** @type {(inputs: Pathways_Explorecoursesalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer les cours`)
};

const ar_pathways_explorecoursesalt2 = /** @type {(inputs: Pathways_Explorecoursesalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف الدورات`)
};

/**
* | output |
* | --- |
* | "Explore Courses" |
*
* @param {Pathways_Explorecoursesalt2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_explorecoursesalt2 = /** @type {((inputs?: Pathways_Explorecoursesalt2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Explorecoursesalt2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_explorecoursesalt2(inputs)
	if (locale === "es") return es_pathways_explorecoursesalt2(inputs)
	if (locale === "fr") return fr_pathways_explorecoursesalt2(inputs)
	return ar_pathways_explorecoursesalt2(inputs)
});
export { pathways_explorecoursesalt2 as "pathways.exploreCoursesAlt" }