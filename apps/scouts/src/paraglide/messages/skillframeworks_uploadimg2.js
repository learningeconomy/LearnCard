/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Uploadimg2Inputs */

const en_skillframeworks_uploadimg2 = /** @type {(inputs: Skillframeworks_Uploadimg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Image`)
};

const es_skillframeworks_uploadimg2 = /** @type {(inputs: Skillframeworks_Uploadimg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir Imagen`)
};

const fr_skillframeworks_uploadimg2 = /** @type {(inputs: Skillframeworks_Uploadimg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger une image`)
};

const ar_skillframeworks_uploadimg2 = /** @type {(inputs: Skillframeworks_Uploadimg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Image`)
};

/**
* | output |
* | --- |
* | "Upload Image" |
*
* @param {Skillframeworks_Uploadimg2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_uploadimg2 = /** @type {((inputs?: Skillframeworks_Uploadimg2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Uploadimg2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_uploadimg2(inputs)
	if (locale === "es") return es_skillframeworks_uploadimg2(inputs)
	if (locale === "fr") return fr_skillframeworks_uploadimg2(inputs)
	return ar_skillframeworks_uploadimg2(inputs)
});
export { skillframeworks_uploadimg2 as "skillFrameworks.uploadImg" }