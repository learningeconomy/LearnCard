/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Belowaverage1Inputs */

const en_pathways_belowaverage1 = /** @type {(inputs: Pathways_Belowaverage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Below Average`)
};

const es_pathways_belowaverage1 = /** @type {(inputs: Pathways_Belowaverage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por debajo del promedio`)
};

const fr_pathways_belowaverage1 = /** @type {(inputs: Pathways_Belowaverage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inférieur à la moyenne`)
};

const ar_pathways_belowaverage1 = /** @type {(inputs: Pathways_Belowaverage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أقل من المتوسط`)
};

/**
* | output |
* | --- |
* | "Below Average" |
*
* @param {Pathways_Belowaverage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_belowaverage1 = /** @type {((inputs?: Pathways_Belowaverage1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Belowaverage1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_belowaverage1(inputs)
	if (locale === "es") return es_pathways_belowaverage1(inputs)
	if (locale === "fr") return fr_pathways_belowaverage1(inputs)
	return ar_pathways_belowaverage1(inputs)
});
export { pathways_belowaverage1 as "pathways.belowAverage" }