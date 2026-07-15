/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Nationalnetwork1Inputs */

const en_troops_nationalnetwork1 = /** @type {(inputs: Troops_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Network:`)
};

const es_troops_nationalnetwork1 = /** @type {(inputs: Troops_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red Nacional:`)
};

const fr_troops_nationalnetwork1 = /** @type {(inputs: Troops_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau national :`)
};

const ar_troops_nationalnetwork1 = /** @type {(inputs: Troops_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Network:`)
};

/**
* | output |
* | --- |
* | "National Network:" |
*
* @param {Troops_Nationalnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_nationalnetwork1 = /** @type {((inputs?: Troops_Nationalnetwork1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Nationalnetwork1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_nationalnetwork1(inputs)
	if (locale === "es") return es_troops_nationalnetwork1(inputs)
	if (locale === "fr") return fr_troops_nationalnetwork1(inputs)
	return ar_troops_nationalnetwork1(inputs)
});
export { troops_nationalnetwork1 as "troops.nationalNetwork" }