/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Templateutilization2Inputs */

const en_developerportal_dashboards_tabs_analytics_templateutilization2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Templateutilization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template Utilization`)
};

const es_developerportal_dashboards_tabs_analytics_templateutilization2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Templateutilization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilización de Plantillas`)
};

const fr_developerportal_dashboards_tabs_analytics_templateutilization2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Templateutilization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisation des Modèles`)
};

const ar_developerportal_dashboards_tabs_analytics_templateutilization2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Templateutilization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدام القالب`)
};

/**
* | output |
* | --- |
* | "Template Utilization" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Templateutilization2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_templateutilization2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Templateutilization2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Templateutilization2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_templateutilization2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_templateutilization2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_templateutilization2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_templateutilization2(inputs)
});
export { developerportal_dashboards_tabs_analytics_templateutilization2 as "developerPortal.dashboards.tabs.analytics.templateUtilization" }