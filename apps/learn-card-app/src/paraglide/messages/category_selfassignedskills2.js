/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Selfassignedskills2Inputs */

const en_category_selfassignedskills2 = /** @type {(inputs: Category_Selfassignedskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self-Assigned Skills`)
};

const es_category_selfassignedskills2 = /** @type {(inputs: Category_Selfassignedskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades autoasignadas`)
};

const fr_category_selfassignedskills2 = /** @type {(inputs: Category_Selfassignedskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences auto-attribuées`)
};

const ar_category_selfassignedskills2 = /** @type {(inputs: Category_Selfassignedskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات المعيّنة ذاتيًا`)
};

/**
* | output |
* | --- |
* | "Self-Assigned Skills" |
*
* @param {Category_Selfassignedskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_selfassignedskills2 = /** @type {((inputs?: Category_Selfassignedskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Selfassignedskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_selfassignedskills2(inputs)
	if (locale === "es") return es_category_selfassignedskills2(inputs)
	if (locale === "fr") return fr_category_selfassignedskills2(inputs)
	return ar_category_selfassignedskills2(inputs)
});
export { category_selfassignedskills2 as "category.selfAssignedSkills" }