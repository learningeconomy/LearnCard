/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Consentflowcontract3Inputs */

const en_developerportal_dashboards_tabs_contracts_consentflowcontract3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Flow Contract`)
};

const es_developerportal_dashboards_tabs_contracts_consentflowcontract3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrato de Flujo de Consentimiento`)
};

const fr_developerportal_dashboards_tabs_contracts_consentflowcontract3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrat de Flux de Consentement`)
};

const ar_developerportal_dashboards_tabs_contracts_consentflowcontract3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عقد تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Consent Flow Contract" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Consentflowcontract3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_consentflowcontract3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontract3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Consentflowcontract3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_consentflowcontract3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_consentflowcontract3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_consentflowcontract3(inputs)
	return ar_developerportal_dashboards_tabs_contracts_consentflowcontract3(inputs)
});
export { developerportal_dashboards_tabs_contracts_consentflowcontract3 as "developerPortal.dashboards.tabs.contracts.consentFlowContract" }