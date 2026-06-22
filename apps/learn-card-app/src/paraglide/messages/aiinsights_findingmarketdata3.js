/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Findingmarketdata3Inputs */

const en_aiinsights_findingmarketdata3 = /** @type {(inputs: Aiinsights_Findingmarketdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finding market data...`)
};

const es_aiinsights_findingmarketdata3 = /** @type {(inputs: Aiinsights_Findingmarketdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscando datos de mercado...`)
};

const fr_aiinsights_findingmarketdata3 = /** @type {(inputs: Aiinsights_Findingmarketdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherche de données de marché...`)
};

const ar_aiinsights_findingmarketdata3 = /** @type {(inputs: Aiinsights_Findingmarketdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري البحث عن بيانات السوق`)
};

/**
* | output |
* | --- |
* | "Finding market data..." |
*
* @param {Aiinsights_Findingmarketdata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_findingmarketdata3 = /** @type {((inputs?: Aiinsights_Findingmarketdata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Findingmarketdata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_findingmarketdata3(inputs)
	if (locale === "es") return es_aiinsights_findingmarketdata3(inputs)
	if (locale === "fr") return fr_aiinsights_findingmarketdata3(inputs)
	return ar_aiinsights_findingmarketdata3(inputs)
});
export { aiinsights_findingmarketdata3 as "aiInsights.findingMarketData" }