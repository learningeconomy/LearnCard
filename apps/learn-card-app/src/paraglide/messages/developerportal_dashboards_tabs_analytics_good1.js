/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Good1Inputs */

const en_developerportal_dashboards_tabs_analytics_good1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Good1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Good`)
};

const es_developerportal_dashboards_tabs_analytics_good1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Good1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buena`)
};

const fr_developerportal_dashboards_tabs_analytics_good1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Good1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bon`)
};

const ar_developerportal_dashboards_tabs_analytics_good1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Good1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جيد`)
};

/**
* | output |
* | --- |
* | "Good" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Good1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_good1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Good1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Good1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_good1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_good1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_good1(inputs)
	return ar_developerportal_dashboards_tabs_analytics_good1(inputs)
});
export { developerportal_dashboards_tabs_analytics_good1 as "developerPortal.dashboards.tabs.analytics.good" }