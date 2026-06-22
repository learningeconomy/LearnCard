/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformance3Inputs */

const en_developerportal_dashboards_tabs_analytics_tipgreatperformance3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Great Performance!`)
};

const es_developerportal_dashboards_tabs_analytics_tipgreatperformance3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Gran Rendimiento!`)
};

const fr_developerportal_dashboards_tabs_analytics_tipgreatperformance3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excellente Performance !`)
};

const ar_developerportal_dashboards_tabs_analytics_tipgreatperformance3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أداء رائع!`)
};

/**
* | output |
* | --- |
* | "Great Performance!" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformance3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_tipgreatperformance3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformance3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformance3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_tipgreatperformance3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_tipgreatperformance3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_tipgreatperformance3(inputs)
	return ar_developerportal_dashboards_tabs_analytics_tipgreatperformance3(inputs)
});
export { developerportal_dashboards_tabs_analytics_tipgreatperformance3 as "developerPortal.dashboards.tabs.analytics.tipGreatPerformance" }