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

const de_pathways_courses = /** @type {(inputs: Pathways_CoursesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kurse`)
};

const ar_pathways_courses = /** @type {(inputs: Pathways_CoursesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدورات`)
};

const fr_pathways_courses = /** @type {(inputs: Pathways_CoursesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cours`)
};

const ko_pathways_courses = /** @type {(inputs: Pathways_CoursesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`과정`)
};

/**
* | output |
* | --- |
* | "Courses" |
*
* @param {Pathways_CoursesInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_courses = /** @type {((inputs?: Pathways_CoursesInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_CoursesInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_courses(inputs)
	if (locale === "es") return es_pathways_courses(inputs)
	if (locale === "de") return de_pathways_courses(inputs)
	if (locale === "ar") return ar_pathways_courses(inputs)
	if (locale === "fr") return fr_pathways_courses(inputs)
	return ko_pathways_courses(inputs)
});
export { pathways_courses as "pathways.courses" }