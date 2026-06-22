/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_GoodInputs */

const en_pathways_good = /** @type {(inputs: Pathways_GoodInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Good Enough`)
};

const es_pathways_good = /** @type {(inputs: Pathways_GoodInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suficiente`)
};

const fr_pathways_good = /** @type {(inputs: Pathways_GoodInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suffisant`)
};

const ar_pathways_good = /** @type {(inputs: Pathways_GoodInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جيد بما يكفي`)
};

/**
* | output |
* | --- |
* | "Good Enough" |
*
* @param {Pathways_GoodInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_good = /** @type {((inputs?: Pathways_GoodInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_GoodInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_good(inputs)
	if (locale === "es") return es_pathways_good(inputs)
	if (locale === "fr") return fr_pathways_good(inputs)
	return ar_pathways_good(inputs)
});
export { pathways_good as "pathways.good" }