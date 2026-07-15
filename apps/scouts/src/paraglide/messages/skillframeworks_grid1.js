/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Grid1Inputs */

const en_skillframeworks_grid1 = /** @type {(inputs: Skillframeworks_Grid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grid`)
};

const es_skillframeworks_grid1 = /** @type {(inputs: Skillframeworks_Grid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuadrícula`)
};

const fr_skillframeworks_grid1 = /** @type {(inputs: Skillframeworks_Grid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grille`)
};

const ar_skillframeworks_grid1 = /** @type {(inputs: Skillframeworks_Grid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grid`)
};

/**
* | output |
* | --- |
* | "Grid" |
*
* @param {Skillframeworks_Grid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_grid1 = /** @type {((inputs?: Skillframeworks_Grid1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Grid1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_grid1(inputs)
	if (locale === "es") return es_skillframeworks_grid1(inputs)
	if (locale === "fr") return fr_skillframeworks_grid1(inputs)
	return ar_skillframeworks_grid1(inputs)
});
export { skillframeworks_grid1 as "skillFrameworks.grid" }