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

const de_pathways_belowaverage1 = /** @type {(inputs: Pathways_Belowaverage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unter Durchschnitt`)
};

const ar_pathways_belowaverage1 = /** @type {(inputs: Pathways_Belowaverage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أقل من المتوسط`)
};

const fr_pathways_belowaverage1 = /** @type {(inputs: Pathways_Belowaverage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inférieur à la moyenne`)
};

const ko_pathways_belowaverage1 = /** @type {(inputs: Pathways_Belowaverage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`평균 미만`)
};

/**
* | output |
* | --- |
* | "Below Average" |
*
* @param {Pathways_Belowaverage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_belowaverage1 = /** @type {((inputs?: Pathways_Belowaverage1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Belowaverage1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_belowaverage1(inputs)
	if (locale === "es") return es_pathways_belowaverage1(inputs)
	if (locale === "de") return de_pathways_belowaverage1(inputs)
	if (locale === "ar") return ar_pathways_belowaverage1(inputs)
	if (locale === "fr") return fr_pathways_belowaverage1(inputs)
	return ko_pathways_belowaverage1(inputs)
});
export { pathways_belowaverage1 as "pathways.belowAverage" }