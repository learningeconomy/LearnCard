/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Globalnetwork2Inputs */

const en_skillframeworks_globalnetwork2 = /** @type {(inputs: Skillframeworks_Globalnetwork2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Network`)
};

const es_skillframeworks_globalnetwork2 = /** @type {(inputs: Skillframeworks_Globalnetwork2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red Global`)
};

const fr_skillframeworks_globalnetwork2 = /** @type {(inputs: Skillframeworks_Globalnetwork2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau mondial`)
};

const ar_skillframeworks_globalnetwork2 = /** @type {(inputs: Skillframeworks_Globalnetwork2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة العالمية`)
};

/**
* | output |
* | --- |
* | "Global Network" |
*
* @param {Skillframeworks_Globalnetwork2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_globalnetwork2 = /** @type {((inputs?: Skillframeworks_Globalnetwork2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Globalnetwork2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_globalnetwork2(inputs)
	if (locale === "es") return es_skillframeworks_globalnetwork2(inputs)
	if (locale === "fr") return fr_skillframeworks_globalnetwork2(inputs)
	return ar_skillframeworks_globalnetwork2(inputs)
});
export { skillframeworks_globalnetwork2 as "skillFrameworks.globalNetwork" }