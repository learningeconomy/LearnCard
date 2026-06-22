/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Addtitleforqualitativefactors5Inputs */

const en_aiinsights_addtitleforqualitativefactors5 = /** @type {(inputs: Aiinsights_Addtitleforqualitativefactors5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a professional title to see qualitative factors here.`)
};

const es_aiinsights_addtitleforqualitativefactors5 = /** @type {(inputs: Aiinsights_Addtitleforqualitativefactors5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega un título profesional para ver factores cualitativos aquí.`)
};

const fr_aiinsights_addtitleforqualitativefactors5 = /** @type {(inputs: Aiinsights_Addtitleforqualitativefactors5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez un titre professionnel pour voir les facteurs qualitatifs ici.`)
};

const ar_aiinsights_addtitleforqualitativefactors5 = /** @type {(inputs: Aiinsights_Addtitleforqualitativefactors5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف مسمى وظيفي لرؤية العوامل النوعية هنا.`)
};

/**
* | output |
* | --- |
* | "Add a professional title to see qualitative factors here." |
*
* @param {Aiinsights_Addtitleforqualitativefactors5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_addtitleforqualitativefactors5 = /** @type {((inputs?: Aiinsights_Addtitleforqualitativefactors5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Addtitleforqualitativefactors5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_addtitleforqualitativefactors5(inputs)
	if (locale === "es") return es_aiinsights_addtitleforqualitativefactors5(inputs)
	if (locale === "fr") return fr_aiinsights_addtitleforqualitativefactors5(inputs)
	return ar_aiinsights_addtitleforqualitativefactors5(inputs)
});
export { aiinsights_addtitleforqualitativefactors5 as "aiInsights.addTitleForQualitativeFactors" }