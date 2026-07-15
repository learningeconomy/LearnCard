/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Addcomps2Inputs */

const en_skillframeworks_addcomps2 = /** @type {(inputs: Skillframeworks_Addcomps2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Competencies`)
};

const es_skillframeworks_addcomps2 = /** @type {(inputs: Skillframeworks_Addcomps2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Competencias`)
};

const fr_skillframeworks_addcomps2 = /** @type {(inputs: Skillframeworks_Addcomps2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter des compétences`)
};

const ar_skillframeworks_addcomps2 = /** @type {(inputs: Skillframeworks_Addcomps2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة كفاءات`)
};

/**
* | output |
* | --- |
* | "Add Competencies" |
*
* @param {Skillframeworks_Addcomps2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_addcomps2 = /** @type {((inputs?: Skillframeworks_Addcomps2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Addcomps2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_addcomps2(inputs)
	if (locale === "es") return es_skillframeworks_addcomps2(inputs)
	if (locale === "fr") return fr_skillframeworks_addcomps2(inputs)
	return ar_skillframeworks_addcomps2(inputs)
});
export { skillframeworks_addcomps2 as "skillFrameworks.addComps" }