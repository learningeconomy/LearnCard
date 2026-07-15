/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fileuploadsuccess3Inputs */

const en_skillframeworks_fileuploadsuccess3 = /** @type {(inputs: Skillframeworks_Fileuploadsuccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`File upload successful.`)
};

const es_skillframeworks_fileuploadsuccess3 = /** @type {(inputs: Skillframeworks_Fileuploadsuccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo subido exitosamente.`)
};

const fr_skillframeworks_fileuploadsuccess3 = /** @type {(inputs: Skillframeworks_Fileuploadsuccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier téléchargé avec succès.`)
};

const ar_skillframeworks_fileuploadsuccess3 = /** @type {(inputs: Skillframeworks_Fileuploadsuccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`File upload successful.`)
};

/**
* | output |
* | --- |
* | "File upload successful." |
*
* @param {Skillframeworks_Fileuploadsuccess3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fileuploadsuccess3 = /** @type {((inputs?: Skillframeworks_Fileuploadsuccess3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fileuploadsuccess3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fileuploadsuccess3(inputs)
	if (locale === "es") return es_skillframeworks_fileuploadsuccess3(inputs)
	if (locale === "fr") return fr_skillframeworks_fileuploadsuccess3(inputs)
	return ar_skillframeworks_fileuploadsuccess3(inputs)
});
export { skillframeworks_fileuploadsuccess3 as "skillFrameworks.fileUploadSuccess" }