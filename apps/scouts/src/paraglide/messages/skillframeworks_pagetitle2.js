/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Pagetitle2Inputs */

const en_skillframeworks_pagetitle2 = /** @type {(inputs: Skillframeworks_Pagetitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill Frameworks`)
};

const es_skillframeworks_pagetitle2 = /** @type {(inputs: Skillframeworks_Pagetitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marcos de Habilidades`)
};

const fr_skillframeworks_pagetitle2 = /** @type {(inputs: Skillframeworks_Pagetitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadres de compétences`)
};

const ar_skillframeworks_pagetitle2 = /** @type {(inputs: Skillframeworks_Pagetitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill Frameworks`)
};

/**
* | output |
* | --- |
* | "Skill Frameworks" |
*
* @param {Skillframeworks_Pagetitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_pagetitle2 = /** @type {((inputs?: Skillframeworks_Pagetitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Pagetitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_pagetitle2(inputs)
	if (locale === "es") return es_skillframeworks_pagetitle2(inputs)
	if (locale === "fr") return fr_skillframeworks_pagetitle2(inputs)
	return ar_skillframeworks_pagetitle2(inputs)
});
export { skillframeworks_pagetitle2 as "skillFrameworks.pageTitle" }