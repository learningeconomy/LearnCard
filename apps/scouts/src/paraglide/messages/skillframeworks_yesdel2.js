/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Yesdel2Inputs */

const en_skillframeworks_yesdel2 = /** @type {(inputs: Skillframeworks_Yesdel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Delete`)
};

const es_skillframeworks_yesdel2 = /** @type {(inputs: Skillframeworks_Yesdel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, Eliminar`)
};

const fr_skillframeworks_yesdel2 = /** @type {(inputs: Skillframeworks_Yesdel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, supprimer`)
};

const ar_skillframeworks_yesdel2 = /** @type {(inputs: Skillframeworks_Yesdel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Delete`)
};

/**
* | output |
* | --- |
* | "Yes, Delete" |
*
* @param {Skillframeworks_Yesdel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_yesdel2 = /** @type {((inputs?: Skillframeworks_Yesdel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Yesdel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_yesdel2(inputs)
	if (locale === "es") return es_skillframeworks_yesdel2(inputs)
	if (locale === "fr") return fr_skillframeworks_yesdel2(inputs)
	return ar_skillframeworks_yesdel2(inputs)
});
export { skillframeworks_yesdel2 as "skillFrameworks.yesDel" }