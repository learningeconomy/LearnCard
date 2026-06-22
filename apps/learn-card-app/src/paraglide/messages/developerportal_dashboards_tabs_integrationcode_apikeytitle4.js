/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Apikeytitle4Inputs */

const en_developerportal_dashboards_tabs_integrationcode_apikeytitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Apikeytitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your API Key`)
};

const es_developerportal_dashboards_tabs_integrationcode_apikeytitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Apikeytitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Clave de API`)
};

const fr_developerportal_dashboards_tabs_integrationcode_apikeytitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Apikeytitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Clé API`)
};

const ar_developerportal_dashboards_tabs_integrationcode_apikeytitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Apikeytitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح API الخاص بك`)
};

/**
* | output |
* | --- |
* | "Your API Key" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Apikeytitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_apikeytitle4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Apikeytitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Apikeytitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_apikeytitle4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_apikeytitle4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_apikeytitle4(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_apikeytitle4(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_apikeytitle4 as "developerPortal.dashboards.tabs.integrationCode.apiKeyTitle" }