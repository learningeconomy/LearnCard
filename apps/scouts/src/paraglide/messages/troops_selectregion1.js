/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Selectregion1Inputs */

const en_troops_selectregion1 = /** @type {(inputs: Troops_Selectregion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Region`)
};

const es_troops_selectregion1 = /** @type {(inputs: Troops_Selectregion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Región`)
};

const fr_troops_selectregion1 = /** @type {(inputs: Troops_Selectregion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner une région`)
};

const ar_troops_selectregion1 = /** @type {(inputs: Troops_Selectregion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Region`)
};

/**
* | output |
* | --- |
* | "Select Region" |
*
* @param {Troops_Selectregion1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_selectregion1 = /** @type {((inputs?: Troops_Selectregion1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Selectregion1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_selectregion1(inputs)
	if (locale === "es") return es_troops_selectregion1(inputs)
	if (locale === "fr") return fr_troops_selectregion1(inputs)
	return ar_troops_selectregion1(inputs)
});
export { troops_selectregion1 as "troops.selectRegion" }