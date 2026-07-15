/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Yesreplacejson3Inputs */

const en_skillframeworks_yesreplacejson3 = /** @type {(inputs: Skillframeworks_Yesreplacejson3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Replace JSON`)
};

const es_skillframeworks_yesreplacejson3 = /** @type {(inputs: Skillframeworks_Yesreplacejson3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, Reemplazar JSON`)
};

const fr_skillframeworks_yesreplacejson3 = /** @type {(inputs: Skillframeworks_Yesreplacejson3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, remplacer le JSON`)
};

const ar_skillframeworks_yesreplacejson3 = /** @type {(inputs: Skillframeworks_Yesreplacejson3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Replace JSON`)
};

/**
* | output |
* | --- |
* | "Yes, Replace JSON" |
*
* @param {Skillframeworks_Yesreplacejson3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_yesreplacejson3 = /** @type {((inputs?: Skillframeworks_Yesreplacejson3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Yesreplacejson3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_yesreplacejson3(inputs)
	if (locale === "es") return es_skillframeworks_yesreplacejson3(inputs)
	if (locale === "fr") return fr_skillframeworks_yesreplacejson3(inputs)
	return ar_skillframeworks_yesreplacejson3(inputs)
});
export { skillframeworks_yesreplacejson3 as "skillFrameworks.yesReplaceJson" }