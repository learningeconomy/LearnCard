/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Replacejsonq3Inputs */

const en_skillframeworks_replacejsonq3 = /** @type {(inputs: Skillframeworks_Replacejsonq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace JSON file?`)
};

const es_skillframeworks_replacejsonq3 = /** @type {(inputs: Skillframeworks_Replacejsonq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Reemplazar archivo JSON?`)
};

const fr_skillframeworks_replacejsonq3 = /** @type {(inputs: Skillframeworks_Replacejsonq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplacer le fichier JSON ?`)
};

const ar_skillframeworks_replacejsonq3 = /** @type {(inputs: Skillframeworks_Replacejsonq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace JSON file?`)
};

/**
* | output |
* | --- |
* | "Replace JSON file?" |
*
* @param {Skillframeworks_Replacejsonq3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_replacejsonq3 = /** @type {((inputs?: Skillframeworks_Replacejsonq3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Replacejsonq3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_replacejsonq3(inputs)
	if (locale === "es") return es_skillframeworks_replacejsonq3(inputs)
	if (locale === "fr") return fr_skillframeworks_replacejsonq3(inputs)
	return ar_skillframeworks_replacejsonq3(inputs)
});
export { skillframeworks_replacejsonq3 as "skillFrameworks.replaceJsonQ" }