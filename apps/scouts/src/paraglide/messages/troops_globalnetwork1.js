/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Globalnetwork1Inputs */

const en_troops_globalnetwork1 = /** @type {(inputs: Troops_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Network:`)
};

const es_troops_globalnetwork1 = /** @type {(inputs: Troops_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red Global:`)
};

const fr_troops_globalnetwork1 = /** @type {(inputs: Troops_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau mondial :`)
};

const ar_troops_globalnetwork1 = /** @type {(inputs: Troops_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة العالمية:`)
};

/**
* | output |
* | --- |
* | "Global Network:" |
*
* @param {Troops_Globalnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_globalnetwork1 = /** @type {((inputs?: Troops_Globalnetwork1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Globalnetwork1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_globalnetwork1(inputs)
	if (locale === "es") return es_troops_globalnetwork1(inputs)
	if (locale === "fr") return fr_troops_globalnetwork1(inputs)
	return ar_troops_globalnetwork1(inputs)
});
export { troops_globalnetwork1 as "troops.globalNetwork" }