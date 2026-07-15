/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Savefw2Inputs */

const en_skillframeworks_savefw2 = /** @type {(inputs: Skillframeworks_Savefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Framework`)
};

const es_skillframeworks_savefw2 = /** @type {(inputs: Skillframeworks_Savefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar Marco`)
};

const fr_skillframeworks_savefw2 = /** @type {(inputs: Skillframeworks_Savefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer le cadre`)
};

const ar_skillframeworks_savefw2 = /** @type {(inputs: Skillframeworks_Savefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ الإطار`)
};

/**
* | output |
* | --- |
* | "Save Framework" |
*
* @param {Skillframeworks_Savefw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_savefw2 = /** @type {((inputs?: Skillframeworks_Savefw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Savefw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_savefw2(inputs)
	if (locale === "es") return es_skillframeworks_savefw2(inputs)
	if (locale === "fr") return fr_skillframeworks_savefw2(inputs)
	return ar_skillframeworks_savefw2(inputs)
});
export { skillframeworks_savefw2 as "skillFrameworks.saveFw" }