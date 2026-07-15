/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Invalidtroopnumber2Inputs */

const en_troops_invalidtroopnumber2 = /** @type {(inputs: Troops_Invalidtroopnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid Troop number entered`)
};

const es_troops_invalidtroopnumber2 = /** @type {(inputs: Troops_Invalidtroopnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de Troop inválido`)
};

const fr_troops_invalidtroopnumber2 = /** @type {(inputs: Troops_Invalidtroopnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de troupe invalide saisi`)
};

const ar_troops_invalidtroopnumber2 = /** @type {(inputs: Troops_Invalidtroopnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid Troop number entered`)
};

/**
* | output |
* | --- |
* | "Invalid Troop number entered" |
*
* @param {Troops_Invalidtroopnumber2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_invalidtroopnumber2 = /** @type {((inputs?: Troops_Invalidtroopnumber2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Invalidtroopnumber2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_invalidtroopnumber2(inputs)
	if (locale === "es") return es_troops_invalidtroopnumber2(inputs)
	if (locale === "fr") return fr_troops_invalidtroopnumber2(inputs)
	return ar_troops_invalidtroopnumber2(inputs)
});
export { troops_invalidtroopnumber2 as "troops.invalidTroopNumber" }