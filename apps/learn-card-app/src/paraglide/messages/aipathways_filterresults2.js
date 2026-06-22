/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Filterresults2Inputs */

const en_aipathways_filterresults2 = /** @type {(inputs: Aipathways_Filterresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filter results...`)
};

const es_aipathways_filterresults2 = /** @type {(inputs: Aipathways_Filterresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar resultados...`)
};

const fr_aipathways_filterresults2 = /** @type {(inputs: Aipathways_Filterresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrer les résultats...`)
};

const ar_aipathways_filterresults2 = /** @type {(inputs: Aipathways_Filterresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...تصفية النتائج`)
};

/**
* | output |
* | --- |
* | "Filter results..." |
*
* @param {Aipathways_Filterresults2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_filterresults2 = /** @type {((inputs?: Aipathways_Filterresults2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Filterresults2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_filterresults2(inputs)
	if (locale === "es") return es_aipathways_filterresults2(inputs)
	if (locale === "fr") return fr_aipathways_filterresults2(inputs)
	return ar_aipathways_filterresults2(inputs)
});
export { aipathways_filterresults2 as "aiPathways.filterResults" }