/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimrate4Inputs */

const en_developerportal_dashboards_tabs_analytics_tipimproveclaimrate4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimrate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Improve Claim Rate`)
};

const es_developerportal_dashboards_tabs_analytics_tipimproveclaimrate4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimrate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mejorar Tasa de Reclamo`)
};

const fr_developerportal_dashboards_tabs_analytics_tipimproveclaimrate4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimrate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Améliorer le Taux de Réclamation`)
};

const ar_developerportal_dashboards_tabs_analytics_tipimproveclaimrate4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimrate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحسين معدل المطالبة`)
};

/**
* | output |
* | --- |
* | "Improve Claim Rate" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimrate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_tipimproveclaimrate4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimrate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimrate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_tipimproveclaimrate4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_tipimproveclaimrate4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_tipimproveclaimrate4(inputs)
	return ar_developerportal_dashboards_tabs_analytics_tipimproveclaimrate4(inputs)
});
export { developerportal_dashboards_tabs_analytics_tipimproveclaimrate4 as "developerPortal.dashboards.tabs.analytics.tipImproveClaimRate" }