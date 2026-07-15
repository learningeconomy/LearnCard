/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Updsuccess2Inputs */

const en_skillframeworks_updsuccess2 = /** @type {(inputs: Skillframeworks_Updsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update Successful`)
};

const es_skillframeworks_updsuccess2 = /** @type {(inputs: Skillframeworks_Updsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualización Exitosa`)
};

const fr_skillframeworks_updsuccess2 = /** @type {(inputs: Skillframeworks_Updsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mise à jour réussie`)
};

const ar_skillframeworks_updsuccess2 = /** @type {(inputs: Skillframeworks_Updsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update Successful`)
};

/**
* | output |
* | --- |
* | "Update Successful" |
*
* @param {Skillframeworks_Updsuccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_updsuccess2 = /** @type {((inputs?: Skillframeworks_Updsuccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Updsuccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_updsuccess2(inputs)
	if (locale === "es") return es_skillframeworks_updsuccess2(inputs)
	if (locale === "fr") return fr_skillframeworks_updsuccess2(inputs)
	return ar_skillframeworks_updsuccess2(inputs)
});
export { skillframeworks_updsuccess2 as "skillFrameworks.updSuccess" }