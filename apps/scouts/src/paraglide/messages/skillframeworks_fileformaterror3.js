/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fileformaterror3Inputs */

const en_skillframeworks_fileformaterror3 = /** @type {(inputs: Skillframeworks_Fileformaterror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`File Formatting Error`)
};

const es_skillframeworks_fileformaterror3 = /** @type {(inputs: Skillframeworks_Fileformaterror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error de Formato de Archivo`)
};

const fr_skillframeworks_fileformaterror3 = /** @type {(inputs: Skillframeworks_Fileformaterror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur de format de fichier`)
};

const ar_skillframeworks_fileformaterror3 = /** @type {(inputs: Skillframeworks_Fileformaterror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`File Formatting Error`)
};

/**
* | output |
* | --- |
* | "File Formatting Error" |
*
* @param {Skillframeworks_Fileformaterror3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fileformaterror3 = /** @type {((inputs?: Skillframeworks_Fileformaterror3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fileformaterror3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fileformaterror3(inputs)
	if (locale === "es") return es_skillframeworks_fileformaterror3(inputs)
	if (locale === "fr") return fr_skillframeworks_fileformaterror3(inputs)
	return ar_skillframeworks_fileformaterror3(inputs)
});
export { skillframeworks_fileformaterror3 as "skillFrameworks.fileFormatError" }