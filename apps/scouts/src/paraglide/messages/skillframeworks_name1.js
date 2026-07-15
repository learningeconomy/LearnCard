/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Name1Inputs */

const en_skillframeworks_name1 = /** @type {(inputs: Skillframeworks_Name1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const es_skillframeworks_name1 = /** @type {(inputs: Skillframeworks_Name1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre`)
};

const fr_skillframeworks_name1 = /** @type {(inputs: Skillframeworks_Name1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom`)
};

const ar_skillframeworks_name1 = /** @type {(inputs: Skillframeworks_Name1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

/**
* | output |
* | --- |
* | "Name" |
*
* @param {Skillframeworks_Name1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_name1 = /** @type {((inputs?: Skillframeworks_Name1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Name1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_name1(inputs)
	if (locale === "es") return es_skillframeworks_name1(inputs)
	if (locale === "fr") return fr_skillframeworks_name1(inputs)
	return ar_skillframeworks_name1(inputs)
});
export { skillframeworks_name1 as "skillFrameworks.name" }