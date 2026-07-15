/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Addtiercomp3Inputs */

const en_skillframeworks_addtiercomp3 = /** @type {(inputs: Skillframeworks_Addtiercomp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add tier or competency`)
};

const es_skillframeworks_addtiercomp3 = /** @type {(inputs: Skillframeworks_Addtiercomp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir nivel o competencia`)
};

const fr_skillframeworks_addtiercomp3 = /** @type {(inputs: Skillframeworks_Addtiercomp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un niveau ou une compétence`)
};

const ar_skillframeworks_addtiercomp3 = /** @type {(inputs: Skillframeworks_Addtiercomp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة مستوى أو كفاءة`)
};

/**
* | output |
* | --- |
* | "Add tier or competency" |
*
* @param {Skillframeworks_Addtiercomp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_addtiercomp3 = /** @type {((inputs?: Skillframeworks_Addtiercomp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Addtiercomp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_addtiercomp3(inputs)
	if (locale === "es") return es_skillframeworks_addtiercomp3(inputs)
	if (locale === "fr") return fr_skillframeworks_addtiercomp3(inputs)
	return ar_skillframeworks_addtiercomp3(inputs)
});
export { skillframeworks_addtiercomp3 as "skillFrameworks.addTierComp" }