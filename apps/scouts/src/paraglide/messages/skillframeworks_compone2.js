/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Compone2Inputs */

const en_skillframeworks_compone2 = /** @type {(inputs: Skillframeworks_Compone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 competency`)
};

const es_skillframeworks_compone2 = /** @type {(inputs: Skillframeworks_Compone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 competencia`)
};

const fr_skillframeworks_compone2 = /** @type {(inputs: Skillframeworks_Compone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 compétence`)
};

const ar_skillframeworks_compone2 = /** @type {(inputs: Skillframeworks_Compone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كفاءة واحدة`)
};

/**
* | output |
* | --- |
* | "1 competency" |
*
* @param {Skillframeworks_Compone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_compone2 = /** @type {((inputs?: Skillframeworks_Compone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Compone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_compone2(inputs)
	if (locale === "es") return es_skillframeworks_compone2(inputs)
	if (locale === "fr") return fr_skillframeworks_compone2(inputs)
	return ar_skillframeworks_compone2(inputs)
});
export { skillframeworks_compone2 as "skillFrameworks.compOne" }