/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Resultother2Inputs */

const en_skillframeworks_resultother2 = /** @type {(inputs: Skillframeworks_Resultother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Results`)
};

const es_skillframeworks_resultother2 = /** @type {(inputs: Skillframeworks_Resultother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Resultados`)
};

const fr_skillframeworks_resultother2 = /** @type {(inputs: Skillframeworks_Resultother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} résultats`)
};

const ar_skillframeworks_resultother2 = /** @type {(inputs: Skillframeworks_Resultother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} نتائج`)
};

/**
* | output |
* | --- |
* | "{count} Results" |
*
* @param {Skillframeworks_Resultother2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_resultother2 = /** @type {((inputs?: Skillframeworks_Resultother2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Resultother2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_resultother2(inputs)
	if (locale === "es") return es_skillframeworks_resultother2(inputs)
	if (locale === "fr") return fr_skillframeworks_resultother2(inputs)
	return ar_skillframeworks_resultother2(inputs)
});
export { skillframeworks_resultother2 as "skillFrameworks.resultOther" }