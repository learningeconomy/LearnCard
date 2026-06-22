/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Framework_FrameworkInputs */

const en_skills_framework_framework = /** @type {(inputs: Skills_Framework_FrameworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework`)
};

const es_skills_framework_framework = /** @type {(inputs: Skills_Framework_FrameworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco`)
};

const fr_skills_framework_framework = /** @type {(inputs: Skills_Framework_FrameworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Référentiel`)
};

const ar_skills_framework_framework = /** @type {(inputs: Skills_Framework_FrameworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإطار`)
};

/**
* | output |
* | --- |
* | "Framework" |
*
* @param {Skills_Framework_FrameworkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_framework_framework = /** @type {((inputs?: Skills_Framework_FrameworkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Framework_FrameworkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_framework_framework(inputs)
	if (locale === "es") return es_skills_framework_framework(inputs)
	if (locale === "fr") return fr_skills_framework_framework(inputs)
	return ar_skills_framework_framework(inputs)
});
export { skills_framework_framework as "skills.framework.framework" }