/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwtiers2Inputs */

const en_skillframeworks_fwtiers2 = /** @type {(inputs: Skillframeworks_Fwtiers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Tiers`)
};

const es_skillframeworks_fwtiers2 = /** @type {(inputs: Skillframeworks_Fwtiers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveles del Marco`)
};

const fr_skillframeworks_fwtiers2 = /** @type {(inputs: Skillframeworks_Fwtiers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveaux du cadre`)
};

const ar_skillframeworks_fwtiers2 = /** @type {(inputs: Skillframeworks_Fwtiers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Tiers`)
};

/**
* | output |
* | --- |
* | "Framework Tiers" |
*
* @param {Skillframeworks_Fwtiers2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwtiers2 = /** @type {((inputs?: Skillframeworks_Fwtiers2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwtiers2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwtiers2(inputs)
	if (locale === "es") return es_skillframeworks_fwtiers2(inputs)
	if (locale === "fr") return fr_skillframeworks_fwtiers2(inputs)
	return ar_skillframeworks_fwtiers2(inputs)
});
export { skillframeworks_fwtiers2 as "skillFrameworks.fwTiers" }