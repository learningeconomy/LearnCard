/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Globalnet2Inputs */

const en_skillframeworks_globalnet2 = /** @type {(inputs: Skillframeworks_Globalnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Network`)
};

const es_skillframeworks_globalnet2 = /** @type {(inputs: Skillframeworks_Globalnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red Global`)
};

const fr_skillframeworks_globalnet2 = /** @type {(inputs: Skillframeworks_Globalnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau mondial`)
};

const ar_skillframeworks_globalnet2 = /** @type {(inputs: Skillframeworks_Globalnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Network`)
};

/**
* | output |
* | --- |
* | "Global Network" |
*
* @param {Skillframeworks_Globalnet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_globalnet2 = /** @type {((inputs?: Skillframeworks_Globalnet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Globalnet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_globalnet2(inputs)
	if (locale === "es") return es_skillframeworks_globalnet2(inputs)
	if (locale === "fr") return fr_skillframeworks_globalnet2(inputs)
	return ar_skillframeworks_globalnet2(inputs)
});
export { skillframeworks_globalnet2 as "skillFrameworks.globalNet" }