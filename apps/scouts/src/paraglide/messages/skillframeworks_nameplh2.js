/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Nameplh2Inputs */

const en_skillframeworks_nameplh2 = /** @type {(inputs: Skillframeworks_Nameplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Scouts Core Skills`)
};

const es_skillframeworks_nameplh2 = /** @type {(inputs: Skillframeworks_Nameplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Scouts Core Skills`)
};

const fr_skillframeworks_nameplh2 = /** @type {(inputs: Skillframeworks_Nameplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex. : Compétences fondamentales Scouts`)
};

const ar_skillframeworks_nameplh2 = /** @type {(inputs: Skillframeworks_Nameplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: مهارات الكشافة الأساسية`)
};

/**
* | output |
* | --- |
* | "e.g., Scouts Core Skills" |
*
* @param {Skillframeworks_Nameplh2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_nameplh2 = /** @type {((inputs?: Skillframeworks_Nameplh2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Nameplh2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_nameplh2(inputs)
	if (locale === "es") return es_skillframeworks_nameplh2(inputs)
	if (locale === "fr") return fr_skillframeworks_nameplh2(inputs)
	return ar_skillframeworks_nameplh2(inputs)
});
export { skillframeworks_nameplh2 as "skillFrameworks.namePlh" }