/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Courses1Inputs */

const en_aipathways_courses1 = /** @type {(inputs: Aipathways_Courses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Courses`)
};

const es_aipathways_courses1 = /** @type {(inputs: Aipathways_Courses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cursos`)
};

const fr_aipathways_courses1 = /** @type {(inputs: Aipathways_Courses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cours`)
};

const ar_aipathways_courses1 = /** @type {(inputs: Aipathways_Courses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدورات`)
};

/**
* | output |
* | --- |
* | "Courses" |
*
* @param {Aipathways_Courses1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_courses1 = /** @type {((inputs?: Aipathways_Courses1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Courses1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_courses1(inputs)
	if (locale === "es") return es_aipathways_courses1(inputs)
	if (locale === "fr") return fr_aipathways_courses1(inputs)
	return ar_aipathways_courses1(inputs)
});
export { aipathways_courses1 as "aiPathways.courses" }