/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwtierresult3Inputs */

const en_skillframeworks_fwtierresult3 = /** @type {(inputs: Skillframeworks_Fwtierresult3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Tier • `)
};

const es_skillframeworks_fwtierresult3 = /** @type {(inputs: Skillframeworks_Fwtierresult3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nivel del Marco • `)
};

const fr_skillframeworks_fwtierresult3 = /** @type {(inputs: Skillframeworks_Fwtierresult3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveau du cadre • `)
};

const ar_skillframeworks_fwtierresult3 = /** @type {(inputs: Skillframeworks_Fwtierresult3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Tier • `)
};

/**
* | output |
* | --- |
* | "Framework Tier •" |
*
* @param {Skillframeworks_Fwtierresult3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwtierresult3 = /** @type {((inputs?: Skillframeworks_Fwtierresult3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwtierresult3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwtierresult3(inputs)
	if (locale === "es") return es_skillframeworks_fwtierresult3(inputs)
	if (locale === "fr") return fr_skillframeworks_fwtierresult3(inputs)
	return ar_skillframeworks_fwtierresult3(inputs)
});
export { skillframeworks_fwtierresult3 as "skillFrameworks.fwTierResult" }