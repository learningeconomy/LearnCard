/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Frameworkapproved2Inputs */

const en_skillframeworks_frameworkapproved2 = /** @type {(inputs: Skillframeworks_Frameworkapproved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Approved`)
};

const es_skillframeworks_frameworkapproved2 = /** @type {(inputs: Skillframeworks_Frameworkapproved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco Aprobado`)
};

const fr_skillframeworks_frameworkapproved2 = /** @type {(inputs: Skillframeworks_Frameworkapproved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre approuvé`)
};

const ar_skillframeworks_frameworkapproved2 = /** @type {(inputs: Skillframeworks_Frameworkapproved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Approved`)
};

/**
* | output |
* | --- |
* | "Framework Approved" |
*
* @param {Skillframeworks_Frameworkapproved2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_frameworkapproved2 = /** @type {((inputs?: Skillframeworks_Frameworkapproved2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Frameworkapproved2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_frameworkapproved2(inputs)
	if (locale === "es") return es_skillframeworks_frameworkapproved2(inputs)
	if (locale === "fr") return fr_skillframeworks_frameworkapproved2(inputs)
	return ar_skillframeworks_frameworkapproved2(inputs)
});
export { skillframeworks_frameworkapproved2 as "skillFrameworks.frameworkApproved" }