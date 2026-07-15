/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwtierbullet3Inputs */

const en_skillframeworks_fwtierbullet3 = /** @type {(inputs: Skillframeworks_Fwtierbullet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Tier • `)
};

const es_skillframeworks_fwtierbullet3 = /** @type {(inputs: Skillframeworks_Fwtierbullet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nivel del Marco • `)
};

const fr_skillframeworks_fwtierbullet3 = /** @type {(inputs: Skillframeworks_Fwtierbullet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveau du cadre • `)
};

const ar_skillframeworks_fwtierbullet3 = /** @type {(inputs: Skillframeworks_Fwtierbullet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستوى الإطار • `)
};

/**
* | output |
* | --- |
* | "Framework Tier •" |
*
* @param {Skillframeworks_Fwtierbullet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwtierbullet3 = /** @type {((inputs?: Skillframeworks_Fwtierbullet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwtierbullet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwtierbullet3(inputs)
	if (locale === "es") return es_skillframeworks_fwtierbullet3(inputs)
	if (locale === "fr") return fr_skillframeworks_fwtierbullet3(inputs)
	return ar_skillframeworks_fwtierbullet3(inputs)
});
export { skillframeworks_fwtierbullet3 as "skillFrameworks.fwTierBullet" }