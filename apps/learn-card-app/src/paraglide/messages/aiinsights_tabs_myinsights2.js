/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Tabs_Myinsights2Inputs */

const en_aiinsights_tabs_myinsights2 = /** @type {(inputs: Aiinsights_Tabs_Myinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My insights`)
};

const es_aiinsights_tabs_myinsights2 = /** @type {(inputs: Aiinsights_Tabs_Myinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mis insights`)
};

const fr_aiinsights_tabs_myinsights2 = /** @type {(inputs: Aiinsights_Tabs_Myinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mes insights`)
};

const ar_aiinsights_tabs_myinsights2 = /** @type {(inputs: Aiinsights_Tabs_Myinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤاي`)
};

/**
* | output |
* | --- |
* | "My insights" |
*
* @param {Aiinsights_Tabs_Myinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_tabs_myinsights2 = /** @type {((inputs?: Aiinsights_Tabs_Myinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Tabs_Myinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_tabs_myinsights2(inputs)
	if (locale === "es") return es_aiinsights_tabs_myinsights2(inputs)
	if (locale === "fr") return fr_aiinsights_tabs_myinsights2(inputs)
	return ar_aiinsights_tabs_myinsights2(inputs)
});
export { aiinsights_tabs_myinsights2 as "aiInsights.tabs.myInsights" }