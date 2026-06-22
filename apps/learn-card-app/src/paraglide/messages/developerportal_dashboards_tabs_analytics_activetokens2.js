/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Activetokens2Inputs */

const en_developerportal_dashboards_tabs_analytics_activetokens2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Activetokens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Active Tokens`)
};

const es_developerportal_dashboards_tabs_analytics_activetokens2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Activetokens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tokens Activos`)
};

const fr_developerportal_dashboards_tabs_analytics_activetokens2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Activetokens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jetons Actifs`)
};

const ar_developerportal_dashboards_tabs_analytics_activetokens2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Activetokens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرموز النشطة`)
};

/**
* | output |
* | --- |
* | "Active Tokens" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Activetokens2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_activetokens2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Activetokens2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Activetokens2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_activetokens2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_activetokens2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_activetokens2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_activetokens2(inputs)
});
export { developerportal_dashboards_tabs_analytics_activetokens2 as "developerPortal.dashboards.tabs.analytics.activeTokens" }