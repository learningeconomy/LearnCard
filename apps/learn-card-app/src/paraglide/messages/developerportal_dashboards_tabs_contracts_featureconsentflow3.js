/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Featureconsentflow3Inputs */

const en_developerportal_dashboards_tabs_contracts_featureconsentflow3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Featureconsentflow3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Flow`)
};

const es_developerportal_dashboards_tabs_contracts_featureconsentflow3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Featureconsentflow3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flujo de Consentimiento`)
};

const fr_developerportal_dashboards_tabs_contracts_featureconsentflow3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Featureconsentflow3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux de Consentement`)
};

const ar_developerportal_dashboards_tabs_contracts_featureconsentflow3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Featureconsentflow3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Consent Flow" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Featureconsentflow3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_featureconsentflow3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Featureconsentflow3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Featureconsentflow3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_featureconsentflow3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_featureconsentflow3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_featureconsentflow3(inputs)
	return ar_developerportal_dashboards_tabs_contracts_featureconsentflow3(inputs)
});
export { developerportal_dashboards_tabs_contracts_featureconsentflow3 as "developerPortal.dashboards.tabs.contracts.featureConsentFlow" }