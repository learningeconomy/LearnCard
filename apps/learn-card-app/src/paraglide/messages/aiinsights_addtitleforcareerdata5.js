/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Addtitleforcareerdata5Inputs */

const en_aiinsights_addtitleforcareerdata5 = /** @type {(inputs: Aiinsights_Addtitleforcareerdata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a professional title to see career data here.`)
};

const es_aiinsights_addtitleforcareerdata5 = /** @type {(inputs: Aiinsights_Addtitleforcareerdata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega un título profesional para ver datos de carrera aquí.`)
};

const fr_aiinsights_addtitleforcareerdata5 = /** @type {(inputs: Aiinsights_Addtitleforcareerdata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez un titre professionnel pour voir les données de carrière ici.`)
};

const ar_aiinsights_addtitleforcareerdata5 = /** @type {(inputs: Aiinsights_Addtitleforcareerdata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف مسمى وظيفي لرؤية بيانات المهنة هنا.`)
};

/**
* | output |
* | --- |
* | "Add a professional title to see career data here." |
*
* @param {Aiinsights_Addtitleforcareerdata5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_addtitleforcareerdata5 = /** @type {((inputs?: Aiinsights_Addtitleforcareerdata5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Addtitleforcareerdata5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_addtitleforcareerdata5(inputs)
	if (locale === "es") return es_aiinsights_addtitleforcareerdata5(inputs)
	if (locale === "fr") return fr_aiinsights_addtitleforcareerdata5(inputs)
	return ar_aiinsights_addtitleforcareerdata5(inputs)
});
export { aiinsights_addtitleforcareerdata5 as "aiInsights.addTitleForCareerData" }