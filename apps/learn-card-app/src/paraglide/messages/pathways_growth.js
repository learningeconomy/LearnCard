/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_GrowthInputs */

const en_pathways_growth = /** @type {(inputs: Pathways_GrowthInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Growth in the Job Market`)
};

const es_pathways_growth = /** @type {(inputs: Pathways_GrowthInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crecimiento en el mercado laboral`)
};

const fr_pathways_growth = /** @type {(inputs: Pathways_GrowthInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Croissance sur le marché du travail`)
};

const ar_pathways_growth = /** @type {(inputs: Pathways_GrowthInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النمو في سوق العمل`)
};

/**
* | output |
* | --- |
* | "Growth in the Job Market" |
*
* @param {Pathways_GrowthInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_growth = /** @type {((inputs?: Pathways_GrowthInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_GrowthInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_growth(inputs)
	if (locale === "es") return es_pathways_growth(inputs)
	if (locale === "fr") return fr_pathways_growth(inputs)
	return ar_pathways_growth(inputs)
});
export { pathways_growth as "pathways.growth" }