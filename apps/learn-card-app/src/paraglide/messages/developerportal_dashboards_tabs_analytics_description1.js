/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Description1Inputs */

const en_developerportal_dashboards_tabs_analytics_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Track your integration performance`)
};

const es_developerportal_dashboards_tabs_analytics_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rastrea el rendimiento de tu integración`)
};

const fr_developerportal_dashboards_tabs_analytics_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suivez les performances de votre intégration`)
};

const ar_developerportal_dashboards_tabs_analytics_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتبع أداء التكامل الخاص بك`)
};

/**
* | output |
* | --- |
* | "Track your integration performance" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_description1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_description1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_description1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_description1(inputs)
	return ar_developerportal_dashboards_tabs_analytics_description1(inputs)
});
export { developerportal_dashboards_tabs_analytics_description1 as "developerPortal.dashboards.tabs.analytics.description" }