/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Viewexample3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_viewexample3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Viewexample3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code Example`)
};

const es_developerportal_dashboards_tabs_integrationcode_viewexample3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Viewexample3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ejemplo de Código`)
};

const fr_developerportal_dashboards_tabs_integrationcode_viewexample3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Viewexample3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exemple de Code`)
};

const ar_developerportal_dashboards_tabs_integrationcode_viewexample3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Viewexample3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال كود`)
};

/**
* | output |
* | --- |
* | "Code Example" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Viewexample3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_viewexample3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Viewexample3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Viewexample3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_viewexample3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_viewexample3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_viewexample3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_viewexample3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_viewexample3 as "developerPortal.dashboards.tabs.integrationCode.viewExample" }