/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Findingcareerdata3Inputs */

const en_aiinsights_findingcareerdata3 = /** @type {(inputs: Aiinsights_Findingcareerdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finding career data...`)
};

const es_aiinsights_findingcareerdata3 = /** @type {(inputs: Aiinsights_Findingcareerdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscando datos de carrera...`)
};

const fr_aiinsights_findingcareerdata3 = /** @type {(inputs: Aiinsights_Findingcareerdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherche de données de carrière...`)
};

const ar_aiinsights_findingcareerdata3 = /** @type {(inputs: Aiinsights_Findingcareerdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري البحث عن بيانات المهنة`)
};

/**
* | output |
* | --- |
* | "Finding career data..." |
*
* @param {Aiinsights_Findingcareerdata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_findingcareerdata3 = /** @type {((inputs?: Aiinsights_Findingcareerdata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Findingcareerdata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_findingcareerdata3(inputs)
	if (locale === "es") return es_aiinsights_findingcareerdata3(inputs)
	if (locale === "fr") return fr_aiinsights_findingcareerdata3(inputs)
	return ar_aiinsights_findingcareerdata3(inputs)
});
export { aiinsights_findingcareerdata3 as "aiInsights.findingCareerData" }