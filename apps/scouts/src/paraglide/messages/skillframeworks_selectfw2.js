/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Selectfw2Inputs */

const en_skillframeworks_selectfw2 = /** @type {(inputs: Skillframeworks_Selectfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a Framework`)
};

const es_skillframeworks_selectfw2 = /** @type {(inputs: Skillframeworks_Selectfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar un Marco`)
};

const fr_skillframeworks_selectfw2 = /** @type {(inputs: Skillframeworks_Selectfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un cadre`)
};

const ar_skillframeworks_selectfw2 = /** @type {(inputs: Skillframeworks_Selectfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر إطاراً`)
};

/**
* | output |
* | --- |
* | "Select a Framework" |
*
* @param {Skillframeworks_Selectfw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_selectfw2 = /** @type {((inputs?: Skillframeworks_Selectfw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Selectfw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_selectfw2(inputs)
	if (locale === "es") return es_skillframeworks_selectfw2(inputs)
	if (locale === "fr") return fr_skillframeworks_selectfw2(inputs)
	return ar_skillframeworks_selectfw2(inputs)
});
export { skillframeworks_selectfw2 as "skillFrameworks.selectFw" }