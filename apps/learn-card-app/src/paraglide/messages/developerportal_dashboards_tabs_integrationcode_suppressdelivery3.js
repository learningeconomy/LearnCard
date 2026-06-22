/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Suppressdelivery3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_suppressdelivery3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Suppressdelivery3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suppress Email Delivery`)
};

const es_developerportal_dashboards_tabs_integrationcode_suppressdelivery3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Suppressdelivery3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suprimir Entrega por Correo`)
};

const fr_developerportal_dashboards_tabs_integrationcode_suppressdelivery3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Suppressdelivery3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer la Livraison par E-mail`)
};

const ar_developerportal_dashboards_tabs_integrationcode_suppressdelivery3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Suppressdelivery3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعطيل التسليم عبر البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Suppress Email Delivery" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Suppressdelivery3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_suppressdelivery3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Suppressdelivery3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Suppressdelivery3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_suppressdelivery3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_suppressdelivery3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_suppressdelivery3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_suppressdelivery3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_suppressdelivery3 as "developerPortal.dashboards.tabs.integrationCode.suppressDelivery" }