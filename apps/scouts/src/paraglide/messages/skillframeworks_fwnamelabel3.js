/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwnamelabel3Inputs */

const en_skillframeworks_fwnamelabel3 = /** @type {(inputs: Skillframeworks_Fwnamelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Name *`)
};

const es_skillframeworks_fwnamelabel3 = /** @type {(inputs: Skillframeworks_Fwnamelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Marco *`)
};

const fr_skillframeworks_fwnamelabel3 = /** @type {(inputs: Skillframeworks_Fwnamelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du cadre *`)
};

const ar_skillframeworks_fwnamelabel3 = /** @type {(inputs: Skillframeworks_Fwnamelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Name *`)
};

/**
* | output |
* | --- |
* | "Framework Name *" |
*
* @param {Skillframeworks_Fwnamelabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwnamelabel3 = /** @type {((inputs?: Skillframeworks_Fwnamelabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwnamelabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwnamelabel3(inputs)
	if (locale === "es") return es_skillframeworks_fwnamelabel3(inputs)
	if (locale === "fr") return fr_skillframeworks_fwnamelabel3(inputs)
	return ar_skillframeworks_fwnamelabel3(inputs)
});
export { skillframeworks_fwnamelabel3 as "skillFrameworks.fwNameLabel" }