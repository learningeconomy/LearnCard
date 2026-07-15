/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Subskills1Inputs */

const en_skillframeworks_subskills1 = /** @type {(inputs: Skillframeworks_Subskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subskills`)
};

const es_skillframeworks_subskills1 = /** @type {(inputs: Skillframeworks_Subskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subhabilidades`)
};

const fr_skillframeworks_subskills1 = /** @type {(inputs: Skillframeworks_Subskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sous-compétences`)
};

const ar_skillframeworks_subskills1 = /** @type {(inputs: Skillframeworks_Subskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات الفرعية`)
};

/**
* | output |
* | --- |
* | "Subskills" |
*
* @param {Skillframeworks_Subskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_subskills1 = /** @type {((inputs?: Skillframeworks_Subskills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Subskills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_subskills1(inputs)
	if (locale === "es") return es_skillframeworks_subskills1(inputs)
	if (locale === "fr") return fr_skillframeworks_subskills1(inputs)
	return ar_skillframeworks_subskills1(inputs)
});
export { skillframeworks_subskills1 as "skillFrameworks.subskills" }