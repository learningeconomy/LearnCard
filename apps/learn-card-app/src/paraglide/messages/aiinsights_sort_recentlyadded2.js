/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Sort_Recentlyadded2Inputs */

const en_aiinsights_sort_recentlyadded2 = /** @type {(inputs: Aiinsights_Sort_Recentlyadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recently Added`)
};

const es_aiinsights_sort_recentlyadded2 = /** @type {(inputs: Aiinsights_Sort_Recentlyadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregados recientemente`)
};

const fr_aiinsights_sort_recentlyadded2 = /** @type {(inputs: Aiinsights_Sort_Recentlyadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutés récemment`)
};

const ar_aiinsights_sort_recentlyadded2 = /** @type {(inputs: Aiinsights_Sort_Recentlyadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أُضيف مؤخرًا`)
};

/**
* | output |
* | --- |
* | "Recently Added" |
*
* @param {Aiinsights_Sort_Recentlyadded2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_sort_recentlyadded2 = /** @type {((inputs?: Aiinsights_Sort_Recentlyadded2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Sort_Recentlyadded2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_sort_recentlyadded2(inputs)
	if (locale === "es") return es_aiinsights_sort_recentlyadded2(inputs)
	if (locale === "fr") return fr_aiinsights_sort_recentlyadded2(inputs)
	return ar_aiinsights_sort_recentlyadded2(inputs)
});
export { aiinsights_sort_recentlyadded2 as "aiInsights.sort.recentlyAdded" }