/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Domainplaceholder3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_domainplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., yourcompany.com`)
};

const es_developerportal_dashboards_tabs_embedconfig_domainplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., tuempresa.com`)
};

const fr_developerportal_dashboards_tabs_embedconfig_domainplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., votreentreprise.com`)
};

const ar_developerportal_dashboards_tabs_embedconfig_domainplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: شركتك.com`)
};

/**
* | output |
* | --- |
* | "e.g., yourcompany.com" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Domainplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_domainplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Domainplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Domainplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_domainplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_domainplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_domainplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_domainplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_domainplaceholder3 as "developerPortal.dashboards.tabs.embedConfig.domainPlaceholder" }