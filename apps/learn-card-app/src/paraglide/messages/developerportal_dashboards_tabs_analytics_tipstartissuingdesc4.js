/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Tipstartissuingdesc4Inputs */

const en_developerportal_dashboards_tabs_analytics_tipstartissuingdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipstartissuingdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the API or embed SDK to issue your first credential.`)
};

const es_developerportal_dashboards_tabs_analytics_tipstartissuingdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipstartissuingdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa la API o el SDK de embed para emitir tu primera credencial.`)
};

const fr_developerportal_dashboards_tabs_analytics_tipstartissuingdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipstartissuingdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez l'API ou le SDK d'embed pour émettre votre premier credential.`)
};

const ar_developerportal_dashboards_tabs_analytics_tipstartissuingdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipstartissuingdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم API أو SDK التضمين لإصدار أول بيانات اعتماد لك.`)
};

/**
* | output |
* | --- |
* | "Use the API or embed SDK to issue your first credential." |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Tipstartissuingdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_tipstartissuingdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Tipstartissuingdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Tipstartissuingdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_tipstartissuingdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_tipstartissuingdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_tipstartissuingdesc4(inputs)
	return ar_developerportal_dashboards_tabs_analytics_tipstartissuingdesc4(inputs)
});
export { developerportal_dashboards_tabs_analytics_tipstartissuingdesc4 as "developerPortal.dashboards.tabs.analytics.tipStartIssuingDesc" }