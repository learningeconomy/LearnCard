/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Desclabel2Inputs */

const en_skillframeworks_desclabel2 = /** @type {(inputs: Skillframeworks_Desclabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const es_skillframeworks_desclabel2 = /** @type {(inputs: Skillframeworks_Desclabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción`)
};

const fr_skillframeworks_desclabel2 = /** @type {(inputs: Skillframeworks_Desclabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const ar_skillframeworks_desclabel2 = /** @type {(inputs: Skillframeworks_Desclabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوصف`)
};

/**
* | output |
* | --- |
* | "Description" |
*
* @param {Skillframeworks_Desclabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_desclabel2 = /** @type {((inputs?: Skillframeworks_Desclabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Desclabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_desclabel2(inputs)
	if (locale === "es") return es_skillframeworks_desclabel2(inputs)
	if (locale === "fr") return fr_skillframeworks_desclabel2(inputs)
	return ar_skillframeworks_desclabel2(inputs)
});
export { skillframeworks_desclabel2 as "skillFrameworks.descLabel" }