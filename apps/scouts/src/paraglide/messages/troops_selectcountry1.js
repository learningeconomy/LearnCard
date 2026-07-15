/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Selectcountry1Inputs */

const en_troops_selectcountry1 = /** @type {(inputs: Troops_Selectcountry1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Country`)
};

const es_troops_selectcountry1 = /** @type {(inputs: Troops_Selectcountry1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar País`)
};

const fr_troops_selectcountry1 = /** @type {(inputs: Troops_Selectcountry1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un pays`)
};

const ar_troops_selectcountry1 = /** @type {(inputs: Troops_Selectcountry1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Country`)
};

/**
* | output |
* | --- |
* | "Select Country" |
*
* @param {Troops_Selectcountry1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_selectcountry1 = /** @type {((inputs?: Troops_Selectcountry1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Selectcountry1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_selectcountry1(inputs)
	if (locale === "es") return es_troops_selectcountry1(inputs)
	if (locale === "fr") return fr_troops_selectcountry1(inputs)
	return ar_troops_selectcountry1(inputs)
});
export { troops_selectcountry1 as "troops.selectCountry" }