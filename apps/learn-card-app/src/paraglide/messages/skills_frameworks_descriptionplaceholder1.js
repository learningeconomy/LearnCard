/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_Descriptionplaceholder1Inputs */

const en_skills_frameworks_descriptionplaceholder1 = /** @type {(inputs: Skills_Frameworks_Descriptionplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Description`)
};

const es_skills_frameworks_descriptionplaceholder1 = /** @type {(inputs: Skills_Frameworks_Descriptionplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción del marco`)
};

const fr_skills_frameworks_descriptionplaceholder1 = /** @type {(inputs: Skills_Frameworks_Descriptionplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description du référentiel`)
};

const ar_skills_frameworks_descriptionplaceholder1 = /** @type {(inputs: Skills_Frameworks_Descriptionplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصف الإطار`)
};

/**
* | output |
* | --- |
* | "Framework Description" |
*
* @param {Skills_Frameworks_Descriptionplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_descriptionplaceholder1 = /** @type {((inputs?: Skills_Frameworks_Descriptionplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Descriptionplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_descriptionplaceholder1(inputs)
	if (locale === "es") return es_skills_frameworks_descriptionplaceholder1(inputs)
	if (locale === "fr") return fr_skills_frameworks_descriptionplaceholder1(inputs)
	return ar_skills_frameworks_descriptionplaceholder1(inputs)
});
export { skills_frameworks_descriptionplaceholder1 as "skills.frameworks.descriptionPlaceholder" }