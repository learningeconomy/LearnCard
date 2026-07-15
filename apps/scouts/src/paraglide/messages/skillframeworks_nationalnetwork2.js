/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Nationalnetwork2Inputs */

const en_skillframeworks_nationalnetwork2 = /** @type {(inputs: Skillframeworks_Nationalnetwork2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Network`)
};

const es_skillframeworks_nationalnetwork2 = /** @type {(inputs: Skillframeworks_Nationalnetwork2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red Nacional`)
};

const fr_skillframeworks_nationalnetwork2 = /** @type {(inputs: Skillframeworks_Nationalnetwork2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau national`)
};

const ar_skillframeworks_nationalnetwork2 = /** @type {(inputs: Skillframeworks_Nationalnetwork2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة الوطنية`)
};

/**
* | output |
* | --- |
* | "National Network" |
*
* @param {Skillframeworks_Nationalnetwork2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_nationalnetwork2 = /** @type {((inputs?: Skillframeworks_Nationalnetwork2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Nationalnetwork2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_nationalnetwork2(inputs)
	if (locale === "es") return es_skillframeworks_nationalnetwork2(inputs)
	if (locale === "fr") return fr_skillframeworks_nationalnetwork2(inputs)
	return ar_skillframeworks_nationalnetwork2(inputs)
});
export { skillframeworks_nationalnetwork2 as "skillFrameworks.nationalNetwork" }