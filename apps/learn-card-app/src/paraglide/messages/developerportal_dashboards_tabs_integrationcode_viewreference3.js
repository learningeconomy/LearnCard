/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Viewreference3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_viewreference3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Viewreference3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost URIs Reference`)
};

const es_developerportal_dashboards_tabs_integrationcode_viewreference3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Viewreference3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Referencia de URI de Boost`)
};

const fr_developerportal_dashboards_tabs_integrationcode_viewreference3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Viewreference3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Référence des URI Boost`)
};

const ar_developerportal_dashboards_tabs_integrationcode_viewreference3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Viewreference3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرجع روابط Boost`)
};

/**
* | output |
* | --- |
* | "Boost URIs Reference" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Viewreference3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_viewreference3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Viewreference3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Viewreference3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_viewreference3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_viewreference3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_viewreference3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_viewreference3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_viewreference3 as "developerPortal.dashboards.tabs.integrationCode.viewReference" }