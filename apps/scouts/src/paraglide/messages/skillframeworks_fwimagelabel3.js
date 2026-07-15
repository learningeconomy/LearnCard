/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwimagelabel3Inputs */

const en_skillframeworks_fwimagelabel3 = /** @type {(inputs: Skillframeworks_Fwimagelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Image`)
};

const es_skillframeworks_fwimagelabel3 = /** @type {(inputs: Skillframeworks_Fwimagelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen del Marco`)
};

const fr_skillframeworks_fwimagelabel3 = /** @type {(inputs: Skillframeworks_Fwimagelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image du cadre`)
};

const ar_skillframeworks_fwimagelabel3 = /** @type {(inputs: Skillframeworks_Fwimagelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Image`)
};

/**
* | output |
* | --- |
* | "Framework Image" |
*
* @param {Skillframeworks_Fwimagelabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwimagelabel3 = /** @type {((inputs?: Skillframeworks_Fwimagelabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwimagelabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwimagelabel3(inputs)
	if (locale === "es") return es_skillframeworks_fwimagelabel3(inputs)
	if (locale === "fr") return fr_skillframeworks_fwimagelabel3(inputs)
	return ar_skillframeworks_fwimagelabel3(inputs)
});
export { skillframeworks_fwimagelabel3 as "skillFrameworks.fwImageLabel" }