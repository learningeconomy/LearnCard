/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Claimrate2Inputs */

const en_developerportal_dashboards_tabs_analytics_claimrate2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Claimrate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim Rate`)
};

const es_developerportal_dashboards_tabs_analytics_claimrate2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Claimrate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tasa de Reclamo`)
};

const fr_developerportal_dashboards_tabs_analytics_claimrate2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Claimrate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Taux de Réclamation`)
};

const ar_developerportal_dashboards_tabs_analytics_claimrate2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Claimrate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معدل المطالبة`)
};

/**
* | output |
* | --- |
* | "Claim Rate" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Claimrate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_claimrate2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Claimrate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Claimrate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_claimrate2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_claimrate2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_claimrate2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_claimrate2(inputs)
});
export { developerportal_dashboards_tabs_analytics_claimrate2 as "developerPortal.dashboards.tabs.analytics.claimRate" }