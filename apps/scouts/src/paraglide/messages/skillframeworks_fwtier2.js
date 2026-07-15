/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwtier2Inputs */

const en_skillframeworks_fwtier2 = /** @type {(inputs: Skillframeworks_Fwtier2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Tier`)
};

const es_skillframeworks_fwtier2 = /** @type {(inputs: Skillframeworks_Fwtier2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nivel del Marco`)
};

const fr_skillframeworks_fwtier2 = /** @type {(inputs: Skillframeworks_Fwtier2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveau du cadre`)
};

const ar_skillframeworks_fwtier2 = /** @type {(inputs: Skillframeworks_Fwtier2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Tier`)
};

/**
* | output |
* | --- |
* | "Framework Tier" |
*
* @param {Skillframeworks_Fwtier2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwtier2 = /** @type {((inputs?: Skillframeworks_Fwtier2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwtier2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwtier2(inputs)
	if (locale === "es") return es_skillframeworks_fwtier2(inputs)
	if (locale === "fr") return fr_skillframeworks_fwtier2(inputs)
	return ar_skillframeworks_fwtier2(inputs)
});
export { skillframeworks_fwtier2 as "skillFrameworks.fwTier" }