/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Processingerror2Inputs */

const en_skillframeworks_processingerror2 = /** @type {(inputs: Skillframeworks_Processingerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Processing Error`)
};

const es_skillframeworks_processingerror2 = /** @type {(inputs: Skillframeworks_Processingerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error de Procesamiento`)
};

const fr_skillframeworks_processingerror2 = /** @type {(inputs: Skillframeworks_Processingerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur de traitement`)
};

const ar_skillframeworks_processingerror2 = /** @type {(inputs: Skillframeworks_Processingerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في المعالجة`)
};

/**
* | output |
* | --- |
* | "Processing Error" |
*
* @param {Skillframeworks_Processingerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_processingerror2 = /** @type {((inputs?: Skillframeworks_Processingerror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Processingerror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_processingerror2(inputs)
	if (locale === "es") return es_skillframeworks_processingerror2(inputs)
	if (locale === "fr") return fr_skillframeworks_processingerror2(inputs)
	return ar_skillframeworks_processingerror2(inputs)
});
export { skillframeworks_processingerror2 as "skillFrameworks.processingError" }