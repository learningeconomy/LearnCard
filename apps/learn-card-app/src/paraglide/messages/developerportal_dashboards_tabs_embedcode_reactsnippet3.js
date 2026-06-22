/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Reactsnippet3Inputs */

const en_developerportal_dashboards_tabs_embedcode_reactsnippet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Reactsnippet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`React / npm`)
};

const es_developerportal_dashboards_tabs_embedcode_reactsnippet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Reactsnippet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`React / npm`)
};

const fr_developerportal_dashboards_tabs_embedcode_reactsnippet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Reactsnippet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`React / npm`)
};

const ar_developerportal_dashboards_tabs_embedcode_reactsnippet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Reactsnippet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`React / npm`)
};

/**
* | output |
* | --- |
* | "React / npm" |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Reactsnippet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_reactsnippet3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Reactsnippet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Reactsnippet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_reactsnippet3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_reactsnippet3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_reactsnippet3(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_reactsnippet3(inputs)
});
export { developerportal_dashboards_tabs_embedcode_reactsnippet3 as "developerPortal.dashboards.tabs.embedCode.reactSnippet" }