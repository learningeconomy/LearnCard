/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_CoursesInputs */

const en_pathways_courses = /** @type {(inputs: Pathways_CoursesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Courses`)
};

const es_pathways_courses = /** @type {(inputs: Pathways_CoursesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cursos`)
};

const fr_pathways_courses = /** @type {(inputs: Pathways_CoursesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cours`)
};

const ar_pathways_courses = /** @type {(inputs: Pathways_CoursesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدورات`)
};

/**
* | output |
* | --- |
* | "Courses" |
*
* @param {Pathways_CoursesInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_courses = /** @type {((inputs?: Pathways_CoursesInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_CoursesInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_courses(inputs)
	if (locale === "es") return es_pathways_courses(inputs)
	if (locale === "fr") return fr_pathways_courses(inputs)
	return ar_pathways_courses(inputs)
});
export { pathways_courses as "pathways.courses" }