/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontract3Inputs */

const en_developerportal_dashboards_tabs_contracts_dataconsentcontract3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Data Consent Contract`)
};

const es_developerportal_dashboards_tabs_contracts_dataconsentcontract3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrato de Consentimiento de Datos`)
};

const fr_developerportal_dashboards_tabs_contracts_dataconsentcontract3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrat de Consentement de Données`)
};

const ar_developerportal_dashboards_tabs_contracts_dataconsentcontract3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عقد موافقة البيانات`)
};

/**
* | output |
* | --- |
* | "Data Consent Contract" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontract3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_dataconsentcontract3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontract3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontract3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_dataconsentcontract3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_dataconsentcontract3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_dataconsentcontract3(inputs)
	return ar_developerportal_dashboards_tabs_contracts_dataconsentcontract3(inputs)
});
export { developerportal_dashboards_tabs_contracts_dataconsentcontract3 as "developerPortal.dashboards.tabs.contracts.dataConsentContract" }