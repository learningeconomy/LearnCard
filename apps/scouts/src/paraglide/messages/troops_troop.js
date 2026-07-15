/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_TroopInputs */

const en_troops_troop = /** @type {(inputs: Troops_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop`)
};

const es_troops_troop = /** @type {(inputs: Troops_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop`)
};

const fr_troops_troop = /** @type {(inputs: Troops_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troupe`)
};

const ar_troops_troop = /** @type {(inputs: Troops_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فرقة`)
};

/**
* | output |
* | --- |
* | "Troop" |
*
* @param {Troops_TroopInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_troop = /** @type {((inputs?: Troops_TroopInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_TroopInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_troop(inputs)
	if (locale === "es") return es_troops_troop(inputs)
	if (locale === "fr") return fr_troops_troop(inputs)
	return ar_troops_troop(inputs)
});
export { troops_troop as "troops.troop" }