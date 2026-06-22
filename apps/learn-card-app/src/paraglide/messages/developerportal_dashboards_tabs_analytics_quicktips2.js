/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Quicktips2Inputs */

const en_developerportal_dashboards_tabs_analytics_quicktips2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Quicktips2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quick Tips`)
};

const es_developerportal_dashboards_tabs_analytics_quicktips2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Quicktips2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consejos Rápidos`)
};

const fr_developerportal_dashboards_tabs_analytics_quicktips2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Quicktips2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conseils Rapides`)
};

const ar_developerportal_dashboards_tabs_analytics_quicktips2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Quicktips2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نصائح سريعة`)
};

/**
* | output |
* | --- |
* | "Quick Tips" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Quicktips2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_quicktips2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Quicktips2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Quicktips2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_quicktips2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_quicktips2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_quicktips2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_quicktips2(inputs)
});
export { developerportal_dashboards_tabs_analytics_quicktips2 as "developerPortal.dashboards.tabs.analytics.quickTips" }