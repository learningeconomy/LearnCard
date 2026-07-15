/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Savewithcount3Inputs */

const en_skillframeworks_savewithcount3 = /** @type {(inputs: Skillframeworks_Savewithcount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save ({count})`)
};

const es_skillframeworks_savewithcount3 = /** @type {(inputs: Skillframeworks_Savewithcount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar ({count})`)
};

const fr_skillframeworks_savewithcount3 = /** @type {(inputs: Skillframeworks_Savewithcount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer ({count})`)
};

const ar_skillframeworks_savewithcount3 = /** @type {(inputs: Skillframeworks_Savewithcount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ ({count})`)
};

/**
* | output |
* | --- |
* | "Save ({count})" |
*
* @param {Skillframeworks_Savewithcount3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_savewithcount3 = /** @type {((inputs?: Skillframeworks_Savewithcount3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Savewithcount3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_savewithcount3(inputs)
	if (locale === "es") return es_skillframeworks_savewithcount3(inputs)
	if (locale === "fr") return fr_skillframeworks_savewithcount3(inputs)
	return ar_skillframeworks_savewithcount3(inputs)
});
export { skillframeworks_savewithcount3 as "skillFrameworks.saveWithCount" }