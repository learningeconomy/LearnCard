/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptions3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_advancedoptions3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced Options`)
};

const es_developerportal_dashboards_tabs_integrationcode_advancedoptions3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opciones Avanzadas`)
};

const fr_developerportal_dashboards_tabs_integrationcode_advancedoptions3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Options Avancées`)
};

const ar_developerportal_dashboards_tabs_integrationcode_advancedoptions3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خيارات متقدمة`)
};

/**
* | output |
* | --- |
* | "Advanced Options" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_advancedoptions3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_advancedoptions3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_advancedoptions3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_advancedoptions3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_advancedoptions3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_advancedoptions3 as "developerPortal.dashboards.tabs.integrationCode.advancedOptions" }