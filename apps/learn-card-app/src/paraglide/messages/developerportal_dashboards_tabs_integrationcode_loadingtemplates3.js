/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Loadingtemplates3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_loadingtemplates3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Loadingtemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_developerportal_dashboards_tabs_integrationcode_loadingtemplates3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Loadingtemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const fr_developerportal_dashboards_tabs_integrationcode_loadingtemplates3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Loadingtemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ar_developerportal_dashboards_tabs_integrationcode_loadingtemplates3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Loadingtemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحميل...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Loadingtemplates3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_loadingtemplates3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Loadingtemplates3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Loadingtemplates3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_loadingtemplates3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_loadingtemplates3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_loadingtemplates3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_loadingtemplates3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_loadingtemplates3 as "developerPortal.dashboards.tabs.integrationCode.loadingTemplates" }