/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Copycode3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_copycode3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copycode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy Code`)
};

const es_developerportal_dashboards_tabs_integrationcode_copycode3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copycode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar Código`)
};

const fr_developerportal_dashboards_tabs_integrationcode_copycode3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copycode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le Code`)
};

const ar_developerportal_dashboards_tabs_integrationcode_copycode3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copycode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الكود`)
};

/**
* | output |
* | --- |
* | "Copy Code" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Copycode3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_copycode3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Copycode3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Copycode3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_copycode3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_copycode3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_copycode3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_copycode3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_copycode3 as "developerPortal.dashboards.tabs.integrationCode.copyCode" }