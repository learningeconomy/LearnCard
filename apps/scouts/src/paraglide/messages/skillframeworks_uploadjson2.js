/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Uploadjson2Inputs */

const en_skillframeworks_uploadjson2 = /** @type {(inputs: Skillframeworks_Uploadjson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload JSON`)
};

const es_skillframeworks_uploadjson2 = /** @type {(inputs: Skillframeworks_Uploadjson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir JSON`)
};

const fr_skillframeworks_uploadjson2 = /** @type {(inputs: Skillframeworks_Uploadjson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le JSON`)
};

const ar_skillframeworks_uploadjson2 = /** @type {(inputs: Skillframeworks_Uploadjson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع JSON`)
};

/**
* | output |
* | --- |
* | "Upload JSON" |
*
* @param {Skillframeworks_Uploadjson2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_uploadjson2 = /** @type {((inputs?: Skillframeworks_Uploadjson2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Uploadjson2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_uploadjson2(inputs)
	if (locale === "es") return es_skillframeworks_uploadjson2(inputs)
	if (locale === "fr") return fr_skillframeworks_uploadjson2(inputs)
	return ar_skillframeworks_uploadjson2(inputs)
});
export { skillframeworks_uploadjson2 as "skillFrameworks.uploadJson" }