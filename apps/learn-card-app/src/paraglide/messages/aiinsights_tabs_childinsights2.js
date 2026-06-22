/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Tabs_Childinsights2Inputs */

const en_aiinsights_tabs_childinsights2 = /** @type {(inputs: Aiinsights_Tabs_Childinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Child insights`)
};

const es_aiinsights_tabs_childinsights2 = /** @type {(inputs: Aiinsights_Tabs_Childinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights de hijos`)
};

const fr_aiinsights_tabs_childinsights2 = /** @type {(inputs: Aiinsights_Tabs_Childinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights des enfants`)
};

const ar_aiinsights_tabs_childinsights2 = /** @type {(inputs: Aiinsights_Tabs_Childinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤى الأطفال`)
};

/**
* | output |
* | --- |
* | "Child insights" |
*
* @param {Aiinsights_Tabs_Childinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_tabs_childinsights2 = /** @type {((inputs?: Aiinsights_Tabs_Childinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Tabs_Childinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_tabs_childinsights2(inputs)
	if (locale === "es") return es_aiinsights_tabs_childinsights2(inputs)
	if (locale === "fr") return fr_aiinsights_tabs_childinsights2(inputs)
	return ar_aiinsights_tabs_childinsights2(inputs)
});
export { aiinsights_tabs_childinsights2 as "aiInsights.tabs.childInsights" }