/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Cantundo2Inputs */

const en_skillframeworks_cantundo2 = /** @type {(inputs: Skillframeworks_Cantundo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This cannot be undone.`)
};

const es_skillframeworks_cantundo2 = /** @type {(inputs: Skillframeworks_Cantundo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto no se puede deshacer.`)
};

const fr_skillframeworks_cantundo2 = /** @type {(inputs: Skillframeworks_Cantundo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette action est irréversible.`)
};

const ar_skillframeworks_cantundo2 = /** @type {(inputs: Skillframeworks_Cantundo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يمكن التراجع عن هذا.`)
};

/**
* | output |
* | --- |
* | "This cannot be undone." |
*
* @param {Skillframeworks_Cantundo2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_cantundo2 = /** @type {((inputs?: Skillframeworks_Cantundo2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Cantundo2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_cantundo2(inputs)
	if (locale === "es") return es_skillframeworks_cantundo2(inputs)
	if (locale === "fr") return fr_skillframeworks_cantundo2(inputs)
	return ar_skillframeworks_cantundo2(inputs)
});
export { skillframeworks_cantundo2 as "skillFrameworks.cantUndo" }