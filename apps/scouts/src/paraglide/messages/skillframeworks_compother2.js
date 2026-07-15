/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Compother2Inputs */

const en_skillframeworks_compother2 = /** @type {(inputs: Skillframeworks_Compother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} competencies`)
};

const es_skillframeworks_compother2 = /** @type {(inputs: Skillframeworks_Compother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} competencias`)
};

const fr_skillframeworks_compother2 = /** @type {(inputs: Skillframeworks_Compother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} compétences`)
};

const ar_skillframeworks_compother2 = /** @type {(inputs: Skillframeworks_Compother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} كفاءات`)
};

/**
* | output |
* | --- |
* | "{count} competencies" |
*
* @param {Skillframeworks_Compother2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_compother2 = /** @type {((inputs?: Skillframeworks_Compother2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Compother2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_compother2(inputs)
	if (locale === "es") return es_skillframeworks_compother2(inputs)
	if (locale === "fr") return fr_skillframeworks_compother2(inputs)
	return ar_skillframeworks_compother2(inputs)
});
export { skillframeworks_compother2 as "skillFrameworks.compOther" }