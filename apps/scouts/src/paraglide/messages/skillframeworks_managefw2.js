/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Managefw2Inputs */

const en_skillframeworks_managefw2 = /** @type {(inputs: Skillframeworks_Managefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Skill Frameworks`)
};

const es_skillframeworks_managefw2 = /** @type {(inputs: Skillframeworks_Managefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar Marcos de Habilidades`)
};

const fr_skillframeworks_managefw2 = /** @type {(inputs: Skillframeworks_Managefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les cadres de compétences`)
};

const ar_skillframeworks_managefw2 = /** @type {(inputs: Skillframeworks_Managefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة أطر المهارات`)
};

/**
* | output |
* | --- |
* | "Manage Skill Frameworks" |
*
* @param {Skillframeworks_Managefw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_managefw2 = /** @type {((inputs?: Skillframeworks_Managefw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Managefw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_managefw2(inputs)
	if (locale === "es") return es_skillframeworks_managefw2(inputs)
	if (locale === "fr") return fr_skillframeworks_managefw2(inputs)
	return ar_skillframeworks_managefw2(inputs)
});
export { skillframeworks_managefw2 as "skillFrameworks.manageFw" }