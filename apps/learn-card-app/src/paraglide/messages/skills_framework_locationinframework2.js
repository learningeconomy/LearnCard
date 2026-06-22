/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Framework_Locationinframework2Inputs */

const en_skills_framework_locationinframework2 = /** @type {(inputs: Skills_Framework_Locationinframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Location in Framework`)
};

const es_skills_framework_locationinframework2 = /** @type {(inputs: Skills_Framework_Locationinframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ubicación en el marco`)
};

const fr_skills_framework_locationinframework2 = /** @type {(inputs: Skills_Framework_Locationinframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emplacement dans le référentiel`)
};

const ar_skills_framework_locationinframework2 = /** @type {(inputs: Skills_Framework_Locationinframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموقع في الإطار`)
};

/**
* | output |
* | --- |
* | "Location in Framework" |
*
* @param {Skills_Framework_Locationinframework2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_framework_locationinframework2 = /** @type {((inputs?: Skills_Framework_Locationinframework2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Framework_Locationinframework2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_framework_locationinframework2(inputs)
	if (locale === "es") return es_skills_framework_locationinframework2(inputs)
	if (locale === "fr") return fr_skills_framework_locationinframework2(inputs)
	return ar_skills_framework_locationinframework2(inputs)
});
export { skills_framework_locationinframework2 as "skills.framework.locationInFramework" }