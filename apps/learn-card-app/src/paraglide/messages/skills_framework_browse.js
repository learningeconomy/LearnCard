/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Framework_BrowseInputs */

const en_skills_framework_browse = /** @type {(inputs: Skills_Framework_BrowseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse`)
};

const es_skills_framework_browse = /** @type {(inputs: Skills_Framework_BrowseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar`)
};

const fr_skills_framework_browse = /** @type {(inputs: Skills_Framework_BrowseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir`)
};

const ar_skills_framework_browse = /** @type {(inputs: Skills_Framework_BrowseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفّح`)
};

/**
* | output |
* | --- |
* | "Browse" |
*
* @param {Skills_Framework_BrowseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_framework_browse = /** @type {((inputs?: Skills_Framework_BrowseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Framework_BrowseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_framework_browse(inputs)
	if (locale === "es") return es_skills_framework_browse(inputs)
	if (locale === "fr") return fr_skills_framework_browse(inputs)
	return ar_skills_framework_browse(inputs)
});
export { skills_framework_browse as "skills.framework.browse" }