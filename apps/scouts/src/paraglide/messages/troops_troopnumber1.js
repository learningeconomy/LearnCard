/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Troopnumber1Inputs */

const en_troops_troopnumber1 = /** @type {(inputs: Troops_Troopnumber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop Number`)
};

const es_troops_troopnumber1 = /** @type {(inputs: Troops_Troopnumber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de Troop`)
};

const fr_troops_troopnumber1 = /** @type {(inputs: Troops_Troopnumber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de troupe`)
};

const ar_troops_troopnumber1 = /** @type {(inputs: Troops_Troopnumber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop Number`)
};

/**
* | output |
* | --- |
* | "Troop Number" |
*
* @param {Troops_Troopnumber1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_troopnumber1 = /** @type {((inputs?: Troops_Troopnumber1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Troopnumber1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_troopnumber1(inputs)
	if (locale === "es") return es_troops_troopnumber1(inputs)
	if (locale === "fr") return fr_troops_troopnumber1(inputs)
	return ar_troops_troopnumber1(inputs)
});
export { troops_troopnumber1 as "troops.troopNumber" }