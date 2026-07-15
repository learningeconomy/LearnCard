/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Replacefile2Inputs */

const en_skillframeworks_replacefile2 = /** @type {(inputs: Skillframeworks_Replacefile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace File`)
};

const es_skillframeworks_replacefile2 = /** @type {(inputs: Skillframeworks_Replacefile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reemplazar Archivo`)
};

const fr_skillframeworks_replacefile2 = /** @type {(inputs: Skillframeworks_Replacefile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplacer le fichier`)
};

const ar_skillframeworks_replacefile2 = /** @type {(inputs: Skillframeworks_Replacefile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace File`)
};

/**
* | output |
* | --- |
* | "Replace File" |
*
* @param {Skillframeworks_Replacefile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_replacefile2 = /** @type {((inputs?: Skillframeworks_Replacefile2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Replacefile2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_replacefile2(inputs)
	if (locale === "es") return es_skillframeworks_replacefile2(inputs)
	if (locale === "fr") return fr_skillframeworks_replacefile2(inputs)
	return ar_skillframeworks_replacefile2(inputs)
});
export { skillframeworks_replacefile2 as "skillFrameworks.replaceFile" }