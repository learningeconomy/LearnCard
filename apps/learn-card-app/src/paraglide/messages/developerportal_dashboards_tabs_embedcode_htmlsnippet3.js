/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Htmlsnippet3Inputs */

const en_developerportal_dashboards_tabs_embedcode_htmlsnippet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Htmlsnippet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTML Snippet`)
};

const es_developerportal_dashboards_tabs_embedcode_htmlsnippet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Htmlsnippet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fragmento HTML`)
};

const fr_developerportal_dashboards_tabs_embedcode_htmlsnippet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Htmlsnippet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extrait HTML`)
};

const ar_developerportal_dashboards_tabs_embedcode_htmlsnippet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Htmlsnippet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقتطف HTML`)
};

/**
* | output |
* | --- |
* | "HTML Snippet" |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Htmlsnippet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_htmlsnippet3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Htmlsnippet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Htmlsnippet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_htmlsnippet3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_htmlsnippet3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_htmlsnippet3(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_htmlsnippet3(inputs)
});
export { developerportal_dashboards_tabs_embedcode_htmlsnippet3 as "developerPortal.dashboards.tabs.embedCode.htmlSnippet" }