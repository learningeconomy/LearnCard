/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Collapse1Inputs */

const en_skillframeworks_collapse1 = /** @type {(inputs: Skillframeworks_Collapse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collapse`)
};

const es_skillframeworks_collapse1 = /** @type {(inputs: Skillframeworks_Collapse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colapsar`)
};

const fr_skillframeworks_collapse1 = /** @type {(inputs: Skillframeworks_Collapse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réduire`)
};

const ar_skillframeworks_collapse1 = /** @type {(inputs: Skillframeworks_Collapse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collapse`)
};

/**
* | output |
* | --- |
* | "Collapse" |
*
* @param {Skillframeworks_Collapse1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_collapse1 = /** @type {((inputs?: Skillframeworks_Collapse1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Collapse1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_collapse1(inputs)
	if (locale === "es") return es_skillframeworks_collapse1(inputs)
	if (locale === "fr") return fr_skillframeworks_collapse1(inputs)
	return ar_skillframeworks_collapse1(inputs)
});
export { skillframeworks_collapse1 as "skillFrameworks.collapse" }