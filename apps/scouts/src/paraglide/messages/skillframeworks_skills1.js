/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Skills1Inputs */

const en_skillframeworks_skills1 = /** @type {(inputs: Skillframeworks_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills`)
};

const es_skillframeworks_skills1 = /** @type {(inputs: Skillframeworks_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades`)
};

const fr_skillframeworks_skills1 = /** @type {(inputs: Skillframeworks_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ar_skillframeworks_skills1 = /** @type {(inputs: Skillframeworks_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات`)
};

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Skillframeworks_Skills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_skills1 = /** @type {((inputs?: Skillframeworks_Skills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Skills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_skills1(inputs)
	if (locale === "es") return es_skillframeworks_skills1(inputs)
	if (locale === "fr") return fr_skillframeworks_skills1(inputs)
	return ar_skillframeworks_skills1(inputs)
});
export { skillframeworks_skills1 as "skillFrameworks.skills" }