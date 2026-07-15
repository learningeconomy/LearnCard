/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Selectfwfirst3Inputs */

const en_skillframeworks_selectfwfirst3 = /** @type {(inputs: Skillframeworks_Selectfwfirst3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select a framework first`)
};

const es_skillframeworks_selectfwfirst3 = /** @type {(inputs: Skillframeworks_Selectfwfirst3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor selecciona un marco primero`)
};

const fr_skillframeworks_selectfwfirst3 = /** @type {(inputs: Skillframeworks_Selectfwfirst3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez d'abord sélectionner un cadre`)
};

const ar_skillframeworks_selectfwfirst3 = /** @type {(inputs: Skillframeworks_Selectfwfirst3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select a framework first`)
};

/**
* | output |
* | --- |
* | "Please select a framework first" |
*
* @param {Skillframeworks_Selectfwfirst3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_selectfwfirst3 = /** @type {((inputs?: Skillframeworks_Selectfwfirst3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Selectfwfirst3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_selectfwfirst3(inputs)
	if (locale === "es") return es_skillframeworks_selectfwfirst3(inputs)
	if (locale === "fr") return fr_skillframeworks_selectfwfirst3(inputs)
	return ar_skillframeworks_selectfwfirst3(inputs)
});
export { skillframeworks_selectfwfirst3 as "skillFrameworks.selectFwFirst" }