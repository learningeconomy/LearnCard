/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Excellent1Inputs */

const en_developerportal_dashboards_tabs_analytics_excellent1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Excellent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excellent`)
};

const es_developerportal_dashboards_tabs_analytics_excellent1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Excellent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excelente`)
};

const fr_developerportal_dashboards_tabs_analytics_excellent1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Excellent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excellent`)
};

const ar_developerportal_dashboards_tabs_analytics_excellent1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Excellent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ممتاز`)
};

/**
* | output |
* | --- |
* | "Excellent" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Excellent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_excellent1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Excellent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Excellent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_excellent1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_excellent1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_excellent1(inputs)
	return ar_developerportal_dashboards_tabs_analytics_excellent1(inputs)
});
export { developerportal_dashboards_tabs_analytics_excellent1 as "developerPortal.dashboards.tabs.analytics.excellent" }