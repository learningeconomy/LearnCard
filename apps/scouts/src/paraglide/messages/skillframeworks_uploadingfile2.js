/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Uploadingfile2Inputs */

const en_skillframeworks_uploadingfile2 = /** @type {(inputs: Skillframeworks_Uploadingfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploading file...`)
};

const es_skillframeworks_uploadingfile2 = /** @type {(inputs: Skillframeworks_Uploadingfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subiendo archivo...`)
};

const fr_skillframeworks_uploadingfile2 = /** @type {(inputs: Skillframeworks_Uploadingfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargement du fichier...`)
};

const ar_skillframeworks_uploadingfile2 = /** @type {(inputs: Skillframeworks_Uploadingfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري رفع الملف...`)
};

/**
* | output |
* | --- |
* | "Uploading file..." |
*
* @param {Skillframeworks_Uploadingfile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_uploadingfile2 = /** @type {((inputs?: Skillframeworks_Uploadingfile2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Uploadingfile2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_uploadingfile2(inputs)
	if (locale === "es") return es_skillframeworks_uploadingfile2(inputs)
	if (locale === "fr") return fr_skillframeworks_uploadingfile2(inputs)
	return ar_skillframeworks_uploadingfile2(inputs)
});
export { skillframeworks_uploadingfile2 as "skillFrameworks.uploadingFile" }