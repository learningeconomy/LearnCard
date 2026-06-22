/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Claimeddesc2Inputs */

const en_developerportal_dashboards_tabs_analytics_claimeddesc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Claimeddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`successfully claimed`)
};

const es_developerportal_dashboards_tabs_analytics_claimeddesc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Claimeddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`reclamadas con éxito`)
};

const fr_developerportal_dashboards_tabs_analytics_claimeddesc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Claimeddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`réclamés avec succès`)
};

const ar_developerportal_dashboards_tabs_analytics_claimeddesc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Claimeddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت المطالبة بنجاح`)
};

/**
* | output |
* | --- |
* | "successfully claimed" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Claimeddesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_claimeddesc2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Claimeddesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Claimeddesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_claimeddesc2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_claimeddesc2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_claimeddesc2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_claimeddesc2(inputs)
});
export { developerportal_dashboards_tabs_analytics_claimeddesc2 as "developerPortal.dashboards.tabs.analytics.claimedDesc" }