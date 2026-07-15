/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Resultone2Inputs */

const en_skillframeworks_resultone2 = /** @type {(inputs: Skillframeworks_Resultone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 Result`)
};

const es_skillframeworks_resultone2 = /** @type {(inputs: Skillframeworks_Resultone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 Resultado`)
};

const fr_skillframeworks_resultone2 = /** @type {(inputs: Skillframeworks_Resultone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 résultat`)
};

const ar_skillframeworks_resultone2 = /** @type {(inputs: Skillframeworks_Resultone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 Result`)
};

/**
* | output |
* | --- |
* | "1 Result" |
*
* @param {Skillframeworks_Resultone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_resultone2 = /** @type {((inputs?: Skillframeworks_Resultone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Resultone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_resultone2(inputs)
	if (locale === "es") return es_skillframeworks_resultone2(inputs)
	if (locale === "fr") return fr_skillframeworks_resultone2(inputs)
	return ar_skillframeworks_resultone2(inputs)
});
export { skillframeworks_resultone2 as "skillFrameworks.resultOne" }